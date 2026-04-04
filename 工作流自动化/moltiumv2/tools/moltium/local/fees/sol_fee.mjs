import { PublicKey, SystemProgram } from '@solana/web3.js';
import { ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

// Default fee recipient (can be overridden by CLI flag or env).
export const DEFAULT_FEE_TO = 'GA9N683FPXx6vFgpZxkFsMwH4RE8okZcGo6g5F5SzZjx';
export const DEFAULT_FEE_BPS = 30; // 0.30%

export function computeFeeLamports({ amountLamports, feeBps = DEFAULT_FEE_BPS }) {
  const bps = BigInt(Math.max(0, Number(feeBps) || 0));
  const amt = BigInt(amountLamports);
  return (amt * bps) / 10_000n;
}

export function buildFeeTransferIx({ fromPubkey, toPubkey, lamports }) {
  const l = BigInt(lamports);
  if (l <= 0n) return null;
  return SystemProgram.transfer({
    fromPubkey: new PublicKey(String(fromPubkey)),
    toPubkey: new PublicKey(String(toPubkey)),
    lamports: Number(l),
  });
}

export async function computeGrossSolDeltaFromTx({ conn, signature, ownerPubkey }) {
  const tx = await conn.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  if (!tx?.meta) throw new Error('transaction meta not found');

  const keys = tx.transaction.message.staticAccountKeys || tx.transaction.message.accountKeys;
  const owner = new PublicKey(String(ownerPubkey));
  const idx = keys.findIndex(k => k.toBase58() === owner.toBase58());
  if (idx === -1) throw new Error('owner not found in tx account keys');

  const pre = BigInt(tx.meta.preBalances[idx] || 0);
  const post = BigInt(tx.meta.postBalances[idx] || 0);
  const fee = BigInt(tx.meta.fee || 0);

  // delta includes paying fee; add it back to approximate gross received.
  const delta = post - pre;
  const grossReceivedLamports = delta + fee;

  return { pre, post, fee, delta, grossReceivedLamports };
}

export async function transferSolFee({ conn, walletKeypair, toPubkey, lamports, cuLimit = 150000, cuPrice }) {
  const ix = buildFeeTransferIx({ fromPubkey: walletKeypair.publicKey, toPubkey, lamports });
  if (!ix) return null;

  const ixs = [ComputeBudgetProgram.setComputeUnitLimit({ units: cuLimit })];
  if (cuPrice) ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: cuPrice }));
  ixs.push(ix);

  // send v0 tx with one refresh attempt (simple + fast)
  const bh = await conn.getLatestBlockhash('processed');
  const msg = new TransactionMessage({
    payerKey: walletKeypair.publicKey,
    recentBlockhash: bh.blockhash,
    instructions: ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([walletKeypair]);

  const sig = await conn.sendTransaction(tx, { skipPreflight: true, preflightCommitment: 'processed', maxRetries: 10 });
  await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
  return sig;
}
