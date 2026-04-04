// Borsh parsers for pump.fun Global + BondingCurve accounts.
// Source basis: HZCX404 memecoin-trading-bots (untrusted external; reviewed) + IDL.

import { struct, bool, u64, publicKey } from '@coral-xyz/borsh';

// Anchor accounts start with an 8-byte discriminator (opaque bytes), not a u64.
// We skip the first 8 bytes and decode the remainder.

export function parseGlobalAccount(buffer) {
  const layout = struct([
    bool('initialized'),
    publicKey('authority'),
    publicKey('feeRecipient'),
    u64('initialVirtualTokenReserves'),
    u64('initialVirtualSolReserves'),
    u64('initialRealTokenReserves'),
    u64('tokenTotalSupply'),
    u64('feeBasisPoints'),
  ]);
  const disc = Buffer.from(buffer).subarray(0, 8);
  const v = layout.decode(Buffer.from(buffer).subarray(8));
  return {
    discriminator: disc.toString('hex'),
    initialized: v.initialized,
    authority: v.authority,
    feeRecipient: v.feeRecipient,
    initialVirtualTokenReserves: BigInt(v.initialVirtualTokenReserves),
    initialVirtualSolReserves: BigInt(v.initialVirtualSolReserves),
    initialRealTokenReserves: BigInt(v.initialRealTokenReserves),
    tokenTotalSupply: BigInt(v.tokenTotalSupply),
    feeBasisPoints: BigInt(v.feeBasisPoints),
  };
}

export function parseBondingCurveAccount(buffer) {
  const layout = struct([
    u64('virtualTokenReserves'),
    u64('virtualSolReserves'),
    u64('realTokenReserves'),
    u64('realSolReserves'),
    u64('tokenTotalSupply'),
    bool('complete'),
  ]);
  const disc = Buffer.from(buffer).subarray(0, 8);
  const v = layout.decode(Buffer.from(buffer).subarray(8));
  return {
    discriminator: disc.toString('hex'),
    virtualTokenReserves: BigInt(v.virtualTokenReserves),
    virtualSolReserves: BigInt(v.virtualSolReserves),
    realTokenReserves: BigInt(v.realTokenReserves),
    realSolReserves: BigInt(v.realSolReserves),
    tokenTotalSupply: BigInt(v.tokenTotalSupply),
    complete: v.complete,
  };
}

export function bondingCurveGetBuyPrice(curve, solInLamports) {
  if (curve.complete) throw new Error('Curve is complete');
  const amount = BigInt(solInLamports);
  if (amount <= 0n) return 0n;
  const n = curve.virtualSolReserves * curve.virtualTokenReserves;
  const i = curve.virtualSolReserves + amount;
  const r = n / i + 1n;
  const s = curve.virtualTokenReserves - r;
  return s < curve.realTokenReserves ? s : curve.realTokenReserves;
}

export function bondingCurveGetSellPrice(curve, tokenInRaw, feeBps) {
  if (curve.complete) throw new Error('Curve is complete');
  const amount = BigInt(tokenInRaw);
  if (amount <= 0n) return 0n;
  const n = (amount * curve.virtualSolReserves) / (curve.virtualTokenReserves + amount);
  const fee = (n * BigInt(feeBps)) / 10000n;
  return n - fee;
}
