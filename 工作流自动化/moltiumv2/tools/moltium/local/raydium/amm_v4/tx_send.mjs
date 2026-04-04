import { ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

export function buildComputeBudgetIxs({ cuLimit = 250000, cuPrice } = {}) {
  const ixs = [];
  if (cuLimit) ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: cuLimit }));
  if (cuPrice) ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: cuPrice }));
  return ixs;
}

export async function sendV0TxWithRefresh({
  conn,
  payer,
  signers,
  ixs,
  attempts = 7,
} = {}) {
  let lastErr = null;
  for (let a = 1; a <= attempts; a++) {
    const bh = await conn.getLatestBlockhash('processed');
    const msg = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: bh.blockhash,
      instructions: ixs,
    }).compileToV0Message();
    const tx = new VersionedTransaction(msg);
    tx.sign(signers);
    try {
      const sig = await conn.sendTransaction(tx, { skipPreflight: true, preflightCommitment: 'processed', maxRetries: 10 });
      const conf = await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
      if (conf.value.err) throw new Error(`confirm err: ${JSON.stringify(conf.value.err)}`);
      return sig;
    } catch (e) {
      lastErr = e;
      const m = String(e?.message || e).toLowerCase();
      if (m.includes('block height exceeded') || m.includes('blockhash not found') || m.includes('expired')) continue;
      throw e;
    }
  }
  throw lastErr;
}

export async function simulateV0Tx({ conn, payer, signers, ixs } = {}) {
  const bh = await conn.getLatestBlockhash('confirmed');
  const msg = new TransactionMessage({ payerKey: payer, recentBlockhash: bh.blockhash, instructions: ixs }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign(signers);
  const sim = await conn.simulateTransaction(tx, { replaceRecentBlockhash: true, sigVerify: false, commitment: 'confirmed' });

  // Expose account key ordering to map meta errors like InsufficientFundsForRent.account_index
  const keys = msg.staticAccountKeys || msg.getAccountKeys?.()?.staticAccountKeys;
  const accountKeys = (keys || []).map(k => k.toBase58());

  return { ...sim.value, accountKeys };
}
