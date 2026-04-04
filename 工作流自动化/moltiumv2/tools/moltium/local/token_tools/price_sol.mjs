// Compute an on-chain SOL price for a token (best-effort, RPC-only)
// Usage: node tools/moltium/local/token_tools/price_sol.mjs <mint>
//
// Strategy:
// - if pump.fun bonding curve exists and complete=false -> bonding curve spot (token per SOL)
// - else -> PumpSwap pool spot via vault reserves

import { getConnection } from '../rpc/connection.mjs';
import { pk, WSOL_MINT } from './constants.mjs';

import { parseBondingCurveAccount, bondingCurveGetBuyPrice } from '../pumpfun_bonding/borsh_accounts.mjs';
import { findBondingCurvePda } from '../pumpfun_bonding/pda.mjs';

import { resolvePoolFull } from '../pumpswap/resolve.mjs';

async function fetchDecimals(conn, mint) {
  const acc = await conn.getParsedAccountInfo(pk(mint), 'confirmed');
  const parsed = acc?.value?.data;
  if (parsed && typeof parsed === 'object' && parsed.parsed?.info?.decimals != null) {
    return Number(parsed.parsed.info.decimals);
  }
  // fallback: raw mint layout
  const info = await conn.getAccountInfo(pk(mint), 'confirmed');
  if (!info?.data) throw new Error('mint not found');
  return Buffer.from(info.data).readUInt8(44);
}

function pow10(n){
  let x = 1n;
  for (let i=0;i<n;i++) x *= 10n;
  return x;
}

function fmtUnits(rawStr, decimals){
  const raw = BigInt(rawStr);
  const base = pow10(decimals);
  const whole = raw / base;
  const frac = raw % base;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/,'');
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

async function main(){
  const [mint] = process.argv.slice(2);
  if(!mint){
    console.error('usage: price_sol.mjs <mint>');
    process.exit(2);
  }

  const { conn, rpcUrl } = getConnection('confirmed');
  const decimals = await fetchDecimals(conn, mint);

  // Try bonding curve first
  try {
    const [curve] = findBondingCurvePda(mint);
    const info = await conn.getAccountInfo(curve, 'confirmed');
    if (info?.data) {
      const curveAcc = parseBondingCurveAccount(Buffer.from(info.data));
      if (!curveAcc.complete) {
        const oneSol = 1_000_000_000n;
        const tokenOutRaw = bondingCurveGetBuyPrice(curveAcc, oneSol);
        console.log(JSON.stringify({
          ok: true,
          rpcUrl,
          mint,
          decimals,
          source: 'bonding',
          complete: false,
          tokenOutFor1SolRaw: tokenOutRaw.toString(),
          tokenOutFor1Sol: fmtUnits(tokenOutRaw.toString(), decimals),
        }, null, 2));
        return;
      }
    }
  } catch {}

  // Fallback: pumpswap reserves
  const res = await resolvePoolFull({ baseMint: mint, quoteMint: WSOL_MINT, user: null });
  if (!res.ok) {
    console.log(JSON.stringify({ ok:false, rpcUrl, mint, error: res.error || 'poolswap resolve failed' }, null, 2));
    process.exit(1);
  }

  const baseVault = pk(res.poolState.poolBaseTokenAccount);
  const quoteVault = pk(res.poolState.poolQuoteTokenAccount);

  const [baseBal, quoteBal] = await Promise.all([
    conn.getTokenAccountBalance(baseVault, 'confirmed'),
    conn.getTokenAccountBalance(quoteVault, 'confirmed'),
  ]);

  const baseRaw = BigInt(baseBal.value.amount);
  const quoteRaw = BigInt(quoteBal.value.amount);

  // Compute with BigInt first for stable derived metrics.
  // lamportsPerToken = quoteRaw / (baseRaw / 10^decimals) = quoteRaw * 10^decimals / baseRaw
  const scale = pow10(decimals);
  const lamportsPerToken = baseRaw > 0n ? (quoteRaw * scale) / baseRaw : null;
  const tokenPerSol = lamportsPerToken && lamportsPerToken > 0n ? (1_000_000_000n * scale) / lamportsPerToken : null;

  // Keep floating estimate too (useful for quick glance)
  const lamportsPerBaseRaw = baseRaw > 0n ? Number(quoteRaw) / Number(baseRaw) : null;

  console.log(JSON.stringify({
    ok: true,
    rpcUrl,
    mint,
    decimals,
    source: 'pumpswap',
    pool: res.pool,
    baseVault: baseVault.toBase58(),
    quoteVault: quoteVault.toBase58(),
    baseRaw: baseRaw.toString(),
    quoteLamportsRaw: quoteRaw.toString(),

    // raw-unit quote
    lamportsPerBaseRaw,

    // human-ish metrics (still derived purely on-chain)
    lamportsPerToken: lamportsPerToken ? lamportsPerToken.toString() : null,
    solPerToken: lamportsPerToken ? (Number(lamportsPerToken) / 1e9) : null,
    tokenPerSolRawScaled: tokenPerSol ? tokenPerSol.toString() : null,
  }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
