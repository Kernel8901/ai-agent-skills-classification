import path from 'node:path';
import { loadWalletKeypair } from '../wallet.mjs';
import { getConnection } from '../rpc/connection.mjs';
import { readJsonIfExists, writeJsonAtomic, appendJsonl, acquireLock } from './lib/fs_state.mjs';
import { pumpfunListRecent, pumpfunListTrending } from './datasources/pumpfun.mjs';
import {
  dexscreenerBoostsTop,
  dexscreenerBoostsLatest,
  dexscreenerAdsLatest,
} from './datasources/dexscreener.mjs';
import { getCoin as pumpfunGetCoin } from '../pumpfunAPI/client.mjs';
import { getTokenPools as dexscreenerGetTokenPools } from '../dexscreenerAPI/client.mjs';
import { toNum, pick } from './lib/normalize.mjs';
import { pumpfunBuyCurve, pumpfunSellCurveAll } from './executors/pumpfun_bonding.mjs';
import { pumpswapBuy, pumpswapSellAll } from './executors/pumpswap.mjs';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

const id = arg('--id');
const forceMint = arg('--force-mint');
const forceVenue = arg('--force-venue'); // pumpswap|bonding (optional)
const forceCreator = arg('--force-creator');
const forceComplete = process.argv.includes('--force-complete');

if (!id) {
  console.error('usage: runtime_tick.mjs --id <strategyId>');
  process.exit(2);
}

const baseDir = path.resolve('tools/moltium/local/autostrategy');
const strategyPath = path.join(baseDir, 'strategies', id, 'strategy.json');
const statePath = path.join(baseDir, 'state', `${id}.json`);
const runsPath = path.join(baseDir, 'runs', `${id}.jsonl`);
const eventsPath = path.join(baseDir, 'events', `${id}.jsonl`);
const lockPath = path.join(baseDir, 'state', `${id}.lock`);

const release = acquireLock(lockPath);
const startedAt = Date.now();

function nowSec() { return Math.floor(Date.now() / 1000); }

try {
  const strategy = readJsonIfExists(strategyPath);
  if (!strategy) throw new Error(`strategy not found: ${strategyPath}`);
  if (!strategy.enabled) {
    console.log(JSON.stringify({ ok: true, id, skipped: 'disabled' }));
    process.exit(0);
  }

  const state = readJsonIfExists(statePath, {
    id,
    createdAt: startedAt,
    lastTickAt: null,
    lastOkAt: null,
    positions: {},
    idempotency: {},
    cooldowns: {},
    cursors: {},
  });

  // Backward compat for older state files
  if (!state.positions) state.positions = {};
  if (!state.idempotency) state.idempotency = {};
  if (!state.cooldowns) state.cooldowns = {};
  if (!state.cursors) state.cursors = {};

  state.lastTickAt = startedAt;

  // --- reconnect + reconcile basics
  const wallet = loadWalletKeypair();
  const { conn, rpcUrl } = getConnection('processed');
  const sol = await conn.getBalance(wallet.publicKey, 'confirmed');
  const solBal = sol / 1e9;

  // budget guard
  if (solBal < Number(strategy?.budgets?.minSolBalance ?? 0)) {
    const out = { ok: true, id, action: 'skip', reason: 'minSolBalance', solBal, minSol: strategy.budgets.minSolBalance, rpcUrl };
    appendJsonl(runsPath, { t: startedAt, ...out });
    writeJsonAtomic(statePath, { ...state, lastOkAt: Date.now() });
    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
  }

  // --- discovery
  // Priority order:
  // 1) dexscreener boosts top
  // 2) dexscreener boosts latest
  // 3) dexscreener ads latest
  // pumpfun new coins only if opted-in.
  const candidates = [];

  // --- test override: bypass discovery/enrichment and trade a specific mint
  if (forceMint) {
    const venue = forceVenue || (forceComplete ? 'pumpswap' : 'bonding');
    const complete = venue === 'pumpswap' ? true : !!forceComplete;
    const creator = venue === 'bonding' ? String(forceCreator || '') : String(forceCreator || '');
    if (venue === 'bonding' && !creator) {
      throw new Error('force-mint requires --force-creator when venue is bonding');
    }

    const feeTo = strategy?.execution?.feeTo || process.env.MOLTIUM_FEE_TO || null;
    const feeBps = (strategy?.execution?.feeBps ?? (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : null));

    const buySol = Number(strategy?.budgets?.buySolPerTrade ?? 0);
    const slippagePct = Math.min(Number(strategy?.slippage?.maxPct ?? 10), 30);
    const cuPrice = Number(strategy?.fees?.cuPrice ?? 0) || null;
    const cuLimit = Number(strategy?.fees?.cuLimit ?? 0) || null;

    const actions = [];
    const mint = forceMint;
    const nowMs = Date.now();

    // exits (if already open)
    const exitAfterSec = Number(strategy?.execution?.exitAfterSec ?? 0) || null;
    const cooldownAfterSellSec = Number(strategy?.execution?.cooldownAfterSellSec ?? 0) || 0;

    if (!strategy.execution?.dryRun && exitAfterSec && state.positions?.[mint]) {
      const p = state.positions[mint];
      const age = (Date.now() - Number(p.openedAt || 0)) / 1000;
      if (age >= exitAfterSec) {
        const idemKey = `sell:${mint}:${Math.floor(Date.now()/60000)}`;
        if (!state.idempotency[idemKey]) {
          let res;
          if (p.venue === 'pumpswap') {
            res = await pumpswapSellAll({ baseMint: mint, slippagePct: 10, feeTo, feeBps, simulate: false });
            actions.push({ type: 'pumpswap_sell_all', mint, out: res.json });
          } else {
            res = await pumpfunSellCurveAll({ mint, creator: p.creator, slippagePct: 10, cuPrice, cuLimit, feeTo, feeBps, simulate: false });
            actions.push({ type: 'sell_curve_all', mint, out: res.json });
          }
          state.idempotency[idemKey] = { t: startedAt, sig: res?.json?.signature || null };
          if (cooldownAfterSellSec > 0) state.cooldowns[mint] = nowMs + cooldownAfterSellSec * 1000;
          delete state.positions[mint];
        }
      }
    }

    // buy (if not open)
    if (!strategy.execution?.dryRun && !state.positions?.[mint] && buySol > 0) {
      const idemKey = `buy:${mint}:${Math.floor(Date.now()/60000)}`;
      if (!state.idempotency[idemKey]) {
        let res;
        let venue2 = venue;
        if (complete) {
          venue2 = 'pumpswap';
          res = await pumpswapBuy({ baseMint: mint, solAmount: buySol, slippagePct, feeTo, feeBps, simulate: false });
          actions.push({ type: 'pumpswap_buy', mint, out: res.json });
        } else {
          venue2 = 'bonding';
          res = await pumpfunBuyCurve({ mint, solAmount: buySol, creator, slippagePct, cuPrice, cuLimit, feeTo, feeBps, simulate: false });
          actions.push({ type: 'buy_curve', mint, out: res.json });
        }
        state.idempotency[idemKey] = { t: startedAt, sig: res?.json?.signature || null };
        state.positions[mint] = { mint, creator, openedAt: startedAt, buySig: res?.json?.signature || null, buySol, source: 'force_mint', venue: venue2, complete };
      }
    }

    const result = { ok: true, id, rpcUrl, solBal, forced: { mint, venue, complete }, actions, note: 'force-mint tick' };
    state.lastOkAt = Date.now();
    writeJsonAtomic(statePath, state);
    appendJsonl(runsPath, { t: startedAt, ...result });
    console.log(JSON.stringify(result, null, 2));
    // NOTE: process.exit would bypass finally{}, so release the lock explicitly.
    release();
    process.exit(0);
  }

  function pickAddr(b) {
    const chainId = b?.chainId || b?.chain || b?.token?.chainId || b?.pair?.chainId;
    const tokenAddress = b?.tokenAddress || b?.address || b?.token?.address || b?.baseToken?.address || b?.token0 || b?.mint;
    return { chainId, tokenAddress };
  }

  if (strategy.discovery?.sources?.dexscreenerBoostsTop) {
    const boosts = await dexscreenerBoostsTop().catch(() => null);
    if (Array.isArray(boosts)) {
      for (const b of boosts.slice(0, 50)) {
        const { chainId, tokenAddress } = pickAddr(b);
        if (!tokenAddress) continue;
        candidates.push({ source: 'dexscreener_boosts_top', chainId, tokenAddress, raw: b });
      }
    }
  }

  if (strategy.discovery?.sources?.dexscreenerBoostsLatest) {
    const boostsLatest = await dexscreenerBoostsLatest().catch(() => null);
    if (Array.isArray(boostsLatest)) {
      for (const b of boostsLatest.slice(0, 50)) {
        const { chainId, tokenAddress } = pickAddr(b);
        if (!tokenAddress) continue;
        candidates.push({ source: 'dexscreener_boosts_latest', chainId, tokenAddress, raw: b });
      }
    }
  }

  if (strategy.discovery?.sources?.dexscreenerAdsLatest) {
    const ads = await dexscreenerAdsLatest().catch(() => null);
    if (Array.isArray(ads)) {
      for (const b of ads.slice(0, 50)) {
        const { chainId, tokenAddress } = pickAddr(b);
        if (!tokenAddress) continue;
        candidates.push({ source: 'dexscreener_ads_latest', chainId, tokenAddress, raw: b });
      }
    }
  }

  // (dexscreener search trend removed)
  if (strategy.discovery?.sources?.pumpfunTrending) {
    const tr = await pumpfunListTrending({ limit: 50, offset: 0 }).catch(() => []);
    for (const c of tr) {
      const mint = c.mint || c.mintAddress || c.address;
      if (!mint) continue;
      candidates.push({ source: 'pumpfun_trending', chainId: 'solana', tokenAddress: mint, raw: c });
    }
  }

  if (strategy.discovery?.usePumpfunNewCoins) {
    const rec = await pumpfunListRecent({ limit: 50, offset: 0 }).catch(() => []);
    for (const c of rec) {
      const mint = c.mint || c.mintAddress || c.address;
      if (!mint) continue;
      candidates.push({ source: 'pumpfun_recent', chainId: 'solana', tokenAddress: mint, raw: c });
    }
  }

  // --- filtering + enrichment (pump.fun + dexscreener)
  const f = strategy.discovery?.filters || {};
  const outCandidates = [];
  for (const c of candidates) {
    if (f.chainId && c.chainId && String(c.chainId).toLowerCase() !== String(f.chainId).toLowerCase()) continue;
    outCandidates.push({ tokenAddress: c.tokenAddress, source: c.source });
  }

  // de-dup
  const uniq = [];
  const seen = new Set();
  for (const c of outCandidates) {
    const k = c.tokenAddress;
    if (!k || seen.has(k)) continue;
    seen.add(k);
    uniq.push(c);
  }

  // Enrich: pumpfun coin (to get creator + created_timestamp) + dexscreener pools (for volume/mcap proxies)
  const enriched = [];
  const debug = { tried: 0, pumpfunOk: 0, pumpfunFail: 0, pumpfunFailSamples: [], filteredComplete: 0, filteredBy: { marketCapMin:0, marketCapMax:0, volume24hMin:0, tokenAgeMinSec:0, tokenAgeMaxSec:0, missingCreator:0, missingMetric:0 } };

  for (const c of uniq.slice(0, 25)) {
    const mint = c.tokenAddress;
    debug.tried++;
    let coin = null;
    try {
      coin = await pumpfunGetCoin(mint);
      debug.pumpfunOk++;
    } catch (e) {
      debug.pumpfunFail++;
      if (debug.pumpfunFailSamples.length < 5) debug.pumpfunFailSamples.push({ mint, err: String(e?.message||e) });
      continue;
    }

    const creator = String(pick(coin, ['creator', 'creator_address', 'dev', 'developer', 'user']) || '');
    const createdTs = toNum(pick(coin, ['created_timestamp', 'createdTs', 'createdAt'])) || null;
    const complete = Boolean(pick(coin, ['complete']) ?? false);

    let pools = null;
    try {
      pools = await dexscreenerGetTokenPools('solana', mint);
    } catch {
      pools = null;
    }
    const pairs = Array.isArray(pools?.pairs) ? pools.pairs : (Array.isArray(pools) ? pools : []);
    const bestPair = pairs[0] || null;
    const volume24h = toNum(pick(bestPair, ['volume.h24', 'volume24h', 'volume24H'])) ?? null;
    // Prefer pump.fun's usd_market_cap if present; fallback to dexscreener pair metrics.
    const mc = toNum(pick(coin, ['usd_market_cap', 'market_cap'])) ?? toNum(pick(bestPair, ['marketCap', 'fdv'])) ?? null;
    const pairCreatedAtMs = toNum(pick(bestPair, ['pairCreatedAt'])) ?? null;

    const ageSec = pairCreatedAtMs ? Math.floor((Date.now() - pairCreatedAtMs) / 1000) : (createdTs ? Math.floor((Date.now()/1000) - createdTs) : null);

    enriched.push({
      mint,
      source: c.source,
      creator,
      createdTs,
      ageSec,
      volume24h,
      marketCap: mc,
      complete,
    });
  }

  function passFilters(x) {
    if (!x.creator) { debug.filteredBy.missingCreator++; return false; }
    // complete=true tokens are on PumpSwap; allow them (executor routes accordingly).

    if ((f.marketCapMin !== null && f.marketCapMin !== undefined) && (x.marketCap === null)) { debug.filteredBy.missingMetric++; return false; }
    if ((f.marketCapMax !== null && f.marketCapMax !== undefined) && (x.marketCap === null)) { debug.filteredBy.missingMetric++; return false; }
    if ((f.volume24hMin !== null && f.volume24hMin !== undefined) && (x.volume24h === null)) { debug.filteredBy.missingMetric++; return false; }

    if (f.marketCapMin !== null && f.marketCapMin !== undefined) {
      if (x.marketCap < Number(f.marketCapMin)) { debug.filteredBy.marketCapMin++; return false; }
    }
    if (f.marketCapMax !== null && f.marketCapMax !== undefined) {
      if (x.marketCap > Number(f.marketCapMax)) { debug.filteredBy.marketCapMax++; return false; }
    }
    if (f.volume24hMin !== null && f.volume24hMin !== undefined) {
      if (x.volume24h < Number(f.volume24hMin)) { debug.filteredBy.volume24hMin++; return false; }
    }
    if (f.tokenAgeMinSec !== null && f.tokenAgeMinSec !== undefined) {
      if (x.ageSec === null || x.ageSec < Number(f.tokenAgeMinSec)) { debug.filteredBy.tokenAgeMinSec++; return false; }
    }
    if (f.tokenAgeMaxSec !== null && f.tokenAgeMaxSec !== undefined) {
      if (x.ageSec === null || x.ageSec > Number(f.tokenAgeMaxSec)) { debug.filteredBy.tokenAgeMaxSec++; return false; }
    }
    return true;
  }

  const filteredEnriched = enriched.filter(passFilters);

  const actions = [];

  // --- execution (MVP): time-based exit + buy at most 1 position per tick
  // 1) exits
  const exitAfterSec = Number(strategy?.execution?.exitAfterSec ?? 0) || null;
  const cooldownAfterSellSec = Number(strategy?.execution?.cooldownAfterSellSec ?? 0) || 0;

  if (!strategy.execution?.dryRun && exitAfterSec && state.positions) {
    for (const [mint, p] of Object.entries(state.positions)) {
      const age = (Date.now() - Number(p.openedAt || 0)) / 1000;
      if (age < exitAfterSec) continue;
      const idemKey = `sell:${mint}:${Math.floor(Date.now()/60000)}`;
      if (state.idempotency[idemKey]) continue;
      try {
        let res;
        const feeTo = strategy?.execution?.feeTo || process.env.MOLTIUM_FEE_TO || null;
        const feeBps = (strategy?.execution?.feeBps ?? (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : null));

        if (p.venue === 'pumpswap') {
          res = await pumpswapSellAll({ baseMint: mint, slippagePct: 10, feeTo, feeBps, simulate: false });
          actions.push({ type: 'pumpswap_sell_all', mint, out: res.json });
        } else {
          res = await pumpfunSellCurveAll({
            mint,
            creator: p.creator,
            slippagePct: 10,
            cuPrice: Number(strategy?.fees?.cuPrice ?? 0) || null,
            cuLimit: Number(strategy?.fees?.cuLimit ?? 0) || null,
            feeTo,
            feeBps,
            simulate: false,
          });
          actions.push({ type: 'sell_curve_all', mint, out: res.json });
        }
        state.idempotency[idemKey] = { t: startedAt, sig: res?.json?.signature || null };
        // set cooldown to avoid immediate re-buy
        if (cooldownAfterSellSec > 0) {
          if (!state.cooldowns) state.cooldowns = {};
          state.cooldowns[mint] = Date.now() + cooldownAfterSellSec * 1000;
        }
        delete state.positions[mint];
      } catch (e) {
        const msg = String(e?.message || e);
        // If there's nothing to sell, treat as already-closed and clean up state.
        if (msg.toLowerCase().includes('no token balance')) {
          actions.push({ type: 'position_already_closed', mint, note: msg });
          if (cooldownAfterSellSec > 0) {
            if (!state.cooldowns) state.cooldowns = {};
            state.cooldowns[mint] = Date.now() + cooldownAfterSellSec * 1000;
          }
          delete state.positions[mint];
        } else {
          actions.push({ type: 'sell_curve_all_failed', mint, error: msg });
        }
      }
    }
  }

  // 2) buy
  const maxPos = Number(strategy?.budgets?.maxOpenPositions ?? 0);
  const openPosCount = Object.keys(state.positions || {}).length;

  if (!strategy.execution?.dryRun && openPosCount < maxPos) {
    const buySol = Number(strategy?.budgets?.buySolPerTrade ?? 0);
    const slippagePct = Math.min(Number(strategy?.slippage?.maxPct ?? 10), 30);
    const cuPrice = Number(strategy?.fees?.cuPrice ?? 0) || null;
    const cuLimit = Number(strategy?.fees?.cuLimit ?? 0) || null;

    const nowMs = Date.now();
    const pickOne = filteredEnriched.find(x => {
      if (state.positions?.[x.mint]) return false;
      const cd = state.cooldowns?.[x.mint];
      if (cd && Number(cd) > nowMs) return false;
      return true;
    });
    if (pickOne && buySol > 0) {
      const idemKey = `buy:${pickOne.mint}:${Math.floor(Date.now()/60000)}`;
      if (!state.idempotency[idemKey]) {
        let res;
        let venue = 'bonding';
        if (pickOne.complete) {
          venue = 'pumpswap';
          const feeTo = strategy?.execution?.feeTo || process.env.MOLTIUM_FEE_TO || null;
          const feeBps = (strategy?.execution?.feeBps ?? (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : null));

          res = await pumpswapBuy({ baseMint: pickOne.mint, solAmount: buySol, slippagePct, feeTo, feeBps, simulate: false });
          actions.push({ type: 'pumpswap_buy', mint: pickOne.mint, out: res.json });
          appendJsonl(eventsPath, { t: startedAt, id, level: 'info', event: 'BUY', venue, mint: pickOne.mint, sol: buySol, sig: res?.json?.signature || null });
        } else {
          const feeTo = strategy?.execution?.feeTo || process.env.MOLTIUM_FEE_TO || null;
          const feeBps = (strategy?.execution?.feeBps ?? (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : null));

          res = await pumpfunBuyCurve({
            mint: pickOne.mint,
            solAmount: buySol,
            creator: pickOne.creator,
            slippagePct,
            cuPrice,
            cuLimit,
            feeTo,
            feeBps,
            simulate: false,
          });
          actions.push({ type: 'buy_curve', mint: pickOne.mint, out: res.json });
        }
        state.idempotency[idemKey] = { t: startedAt, sig: res?.json?.signature || null };
        state.positions[pickOne.mint] = {
          mint: pickOne.mint,
          creator: pickOne.creator,
          openedAt: startedAt,
          buySig: res?.json?.signature || null,
          buySol,
          source: pickOne.source,
          venue,
          complete: !!pickOne.complete,
        };
      }
    }
  }

  const result = {
    ok: true,
    id,
    rpcUrl,
    solBal,
    discovered: uniq.slice(0, 30),
    enriched: filteredEnriched.slice(0, 10),
    actions,
    debug,
    note: strategy.execution?.dryRun ? 'dry-run enabled' : 'MVP: bought at most 1 position per tick',
  };

  state.lastOkAt = Date.now();
  writeJsonAtomic(statePath, state);
  appendJsonl(runsPath, { t: startedAt, ...result });

  console.log(JSON.stringify(result, null, 2));
} finally {
  release();
}
