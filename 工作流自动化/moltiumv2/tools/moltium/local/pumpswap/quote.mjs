// pumpswap quote helper (heuristic, backend-independent)
//
// We do NOT have an official pumpswap IDL, so fee math is inferred.
// We approximate using constant-product with an assumed total fee bps.
// This is used ONLY to set a safer minOut than 1.

import { PublicKey } from '@solana/web3.js';
import { getConnection } from '../rpc/connection.mjs';

function pk(s){ return new PublicKey(String(s)); }

export const DEFAULT_TOTAL_FEE_BPS = 120; // 1.20% (observed: LP 20 + protocol 5 + creator 95)

function applyFee(amount, feeBps) {
  const a = BigInt(amount);
  const bps = BigInt(feeBps);
  return (a * (10_000n - bps)) / 10_000n;
}

function cpOut({ reserveIn, reserveOut, amountInAfterFee }) {
  // dy = (y * dx) / (x + dx)
  const x = BigInt(reserveIn);
  const y = BigInt(reserveOut);
  const dx = BigInt(amountInAfterFee);
  if (dx <= 0n) return 0n;
  return (y * dx) / (x + dx);
}

export async function getPoolReserves({ poolBaseTokenAccount, poolQuoteTokenAccount }) {
  const { conn, rpcUrl } = getConnection('confirmed');

  const [baseBal, quoteBal] = await Promise.all([
    conn.getTokenAccountBalance(pk(poolBaseTokenAccount), 'confirmed'),
    conn.getTokenAccountBalance(pk(poolQuoteTokenAccount), 'confirmed'),
  ]);

  const baseRaw = BigInt(baseBal.value.amount);
  const quoteRaw = BigInt(quoteBal.value.amount);

  return { rpcUrl, baseRaw, quoteRaw, baseDecimals: baseBal.value.decimals, quoteDecimals: quoteBal.value.decimals };
}

export async function quoteBuyBaseOut({
  quoteInLamports,
  poolBaseTokenAccount,
  poolQuoteTokenAccount,
  totalFeeBps = DEFAULT_TOTAL_FEE_BPS,
  slippageBps,
}) {
  const r = await getPoolReserves({ poolBaseTokenAccount, poolQuoteTokenAccount });
  const dxAfterFee = applyFee(quoteInLamports, totalFeeBps);
  const out = cpOut({ reserveIn: r.quoteRaw, reserveOut: r.baseRaw, amountInAfterFee: dxAfterFee });
  const minOut = (out * (10_000n - BigInt(slippageBps))) / 10_000n;
  return { ...r, expectedOutRaw: out, minOutRaw: minOut, totalFeeBps, slippageBps };
}

export async function quoteSellQuoteOut({
  baseInRaw,
  poolBaseTokenAccount,
  poolQuoteTokenAccount,
  totalFeeBps = DEFAULT_TOTAL_FEE_BPS,
  slippageBps,
}) {
  const r = await getPoolReserves({ poolBaseTokenAccount, poolQuoteTokenAccount });
  const dxAfterFee = applyFee(baseInRaw, totalFeeBps);
  const out = cpOut({ reserveIn: r.baseRaw, reserveOut: r.quoteRaw, amountInAfterFee: dxAfterFee });
  const minOut = (out * (10_000n - BigInt(slippageBps))) / 10_000n;
  return { ...r, expectedOutLamports: out, minOutLamports: minOut, totalFeeBps, slippageBps };
}
