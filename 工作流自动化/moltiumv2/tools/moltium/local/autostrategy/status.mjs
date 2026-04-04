// Print active strategies + positions + rough PnL.
// PnL is estimated using a SELL-ALL simulation on pump.fun bonding curve.
// Usage:
//   node tools/moltium/local/autostrategy/status.mjs

import fs from 'node:fs';
import path from 'node:path';
import { readJsonIfExists } from './lib/fs_state.mjs';
import { pumpfunSellCurveAll } from './executors/pumpfun_bonding.mjs';
import { pumpswapSellAll } from './executors/pumpswap.mjs';

const baseDir = path.resolve('tools/moltium/local/autostrategy');
const strategiesDir = path.join(baseDir, 'strategies');
const stateDir = path.join(baseDir, 'state');

function listStrategyIds() {
  if (!fs.existsSync(strategiesDir)) return [];
  return fs.readdirSync(strategiesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

const ids = listStrategyIds();
const strategies = [];

for (const id of ids) {
  const strategyPath = path.join(strategiesDir, id, 'strategy.json');
  const strategy = readJsonIfExists(strategyPath, null);
  if (!strategy) continue;

  const stPath = path.join(stateDir, `${id}.json`);
  const st = readJsonIfExists(stPath, { positions: {} });

  const positions = [];
  const posObj = st?.positions || {};
  for (const [mint, p] of Object.entries(posObj)) {
    const buySol = Number(p?.buySol ?? 0);
    let quote = null;
    try {
      if (p.venue === 'pumpswap' || p.complete === true) {
        quote = await pumpswapSellAll({ baseMint: mint, slippagePct: 10, simulate: true });
      } else {
        quote = await pumpfunSellCurveAll({ mint, creator: p.creator, slippagePct: 10, simulate: true });
      }
    } catch (e) {
      quote = { ok: false, error: String(e?.message || e) };
    }

    let expectedSol = null;
    let pnlSol = null;
    if (quote?.ok) {
      if (quote?.json?.expectedSol) {
        expectedSol = Number(quote.json.expectedSol) / 1e9;
        pnlSol = expectedSol - buySol;
      } else if (quote?.json?.expectedOutLamports) {
        expectedSol = Number(quote.json.expectedOutLamports) / 1e9;
        pnlSol = expectedSol - buySol;
      } else if (quote?.json?.minOutLamports) {
        // pumpswap local_sell_all --simulate returns minOutLamports (slippage-applied)
        expectedSol = Number(quote.json.minOutLamports) / 1e9;
        pnlSol = expectedSol - buySol;
      }
    }

    positions.push({
      mint,
      creator: p.creator,
      openedAt: p.openedAt,
      buySig: p.buySig,
      buySol,
      expectedSol,
      pnlSol,
      quoteOk: !!(quote?.ok && quote?.json?.ok),
      quoteErr: quote?.ok ? (quote?.json?.err || null) : (quote?.error || null),
    });
  }

  strategies.push({
    id,
    enabled: !!strategy.enabled,
    riskProfile: strategy.riskProfile,
    tickSec: strategy.tickSec,
    budgets: strategy.budgets,
    discovery: strategy.discovery?.sources,
    positions,
    lastOkAt: st?.lastOkAt || null,
  });
}

console.log(JSON.stringify({ ok: true, strategies }, null, 2));
