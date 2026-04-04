import { PublicKey, SystemProgram } from '@solana/web3.js';

export function computeFeeLamports({ amountLamports, feeBps }) {
  const bps = BigInt(Math.max(0, Number(feeBps) || 0));
  const amt = BigInt(amountLamports);
  return (amt * bps) / 10_000n;
}

export function buildFeeTransferIx({ from, to, lamports }) {
  if (!to) return null;
  const l = BigInt(lamports);
  if (l <= 0n) return null;
  return SystemProgram.transfer({
    fromPubkey: new PublicKey(String(from)),
    toPubkey: new PublicKey(String(to)),
    lamports: Number(l),
  });
}
