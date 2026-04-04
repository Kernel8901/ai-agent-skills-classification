import { PublicKey } from '@solana/web3.js';
import { buildComputeBudgetIxs, sendV0TxWithRefresh } from './tx_send.mjs';
import { buildFeeTransferIx } from './fee.mjs';

export async function transferSolFee({ conn, wallet, to, lamports, cuLimit = 150000, cuPrice } = {}) {
  const ix = buildFeeTransferIx({ from: wallet.publicKey, to, lamports });
  if (!ix) return null;
  const ixs = [...buildComputeBudgetIxs({ cuLimit, cuPrice }), ix];
  const sig = await sendV0TxWithRefresh({ conn, payer: wallet.publicKey, signers: [wallet], ixs });
  return sig;
}

export async function computeReceivedLamportsFromTx({ conn, signature, ownerPubkey }) {
  const tx = await conn.getTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
  if (!tx?.meta) throw new Error('transaction meta not found');

  const keys = tx.transaction.message.staticAccountKeys || tx.transaction.message.accountKeys;
  const owner = new PublicKey(String(ownerPubkey));
  const idx = keys.findIndex(k => k.toBase58() === owner.toBase58());
  if (idx === -1) throw new Error('owner not found in tx account keys');

  const pre = BigInt(tx.meta.preBalances[idx] || 0);
  const post = BigInt(tx.meta.postBalances[idx] || 0);
  const fee = BigInt(tx.meta.fee || 0);

  // Net delta includes paying fee; add it back to approximate gross received.
  const delta = post - pre;
  const gross = delta + fee;
  return { pre, post, fee, delta, grossReceivedLamports: gross };
}
