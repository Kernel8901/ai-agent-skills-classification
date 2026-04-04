// Encode pumpswap instruction data (reverse engineered)
// BUY:  [disc(8)] [minOutTokens u64 LE] [maxInLamports u64 LE] [flags u8]
// SELL: [disc(8)] [inTokenRaw u64 LE]  [minOutLamports u64 LE]

import { Buffer } from 'node:buffer';
import { DISC_BUY, DISC_SELL } from './constants.mjs';

function discBuf(hex) {
  return Buffer.from(hex, 'hex');
}

function u64le(n) {
  const x = BigInt(n);
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(x);
  return b;
}

export function encodeBuy({ minOutTokens, maxInLamports, flags = 1 }) {
  const d = discBuf(DISC_BUY);
  return Buffer.concat([d, u64le(minOutTokens), u64le(maxInLamports), Buffer.from([Number(flags) & 0xff])]);
}

export function encodeSell({ inTokenRaw, minOutLamports }) {
  const d = discBuf(DISC_SELL);
  return Buffer.concat([d, u64le(inTokenRaw), u64le(minOutLamports)]);
}
