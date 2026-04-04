// Local pumpswap BUY (no Moltium backend, no PumpPortal)
// Usage:
//   node tools/moltium/local/pumpswap/local_buy.mjs <baseMint> <solAmount> [slippagePct=10] [--fee-to <pubkey>] [--fee-bps 30] [--simulate]
//
// Notes:
// - This script is intentionally conservative about secrets (prints only safe fields).
// - minOutTokens is set to 1 (VERY loose) unless you provide a better quoting method.

import { PublicKey, ComputeBudgetProgram, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

import { getConnection } from '../rpc/connection.mjs';
import { loadWalletKeypair } from '../wallet.mjs';
import { resolvePoolFull, WSOL_MINT } from './resolve.mjs';
import { buildBuyIx } from './build.mjs';
import { DEFAULT_FEE_TO, DEFAULT_FEE_BPS, computeFeeLamports, buildFeeTransferIx } from '../fees/sol_fee.mjs';

function pk(s){ return new PublicKey(String(s)); }

async function main(){
  const argv = process.argv.slice(2);
  const simulateOnly = argv.includes('--simulate');

  function arg(name) {
    const i = argv.indexOf(name);
    return i !== -1 ? argv[i + 1] : null;
  }

  const feeTo = arg('--fee-to') || process.env.MOLTIUM_FEE_TO || DEFAULT_FEE_TO;
  const feeBps = arg('--fee-bps') ? Number(arg('--fee-bps')) : (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : DEFAULT_FEE_BPS);

  // positional args: <baseMint> <solAmount> [slippagePct]
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--simulate') continue;
    if (a === '--fee-to' || a === '--fee-bps') { i++; continue; }
    if (a.startsWith('--')) { continue; }
    positional.push(a);
  }
  const [baseMint, solAmountStr, slipStr] = positional;
  if(!baseMint || !solAmountStr){
    console.error('usage: local_buy.mjs <baseMint> <solAmount> [slippagePct=10]');
    process.exit(2);
  }

  const solAmount = Number(solAmountStr);
  const slippagePct = slipStr ? Number(slipStr) : 10;
  if(!Number.isFinite(solAmount) || solAmount <= 0) throw new Error('bad solAmount');

  const wallet = loadWalletKeypair();
  const { conn, rpcUrl } = getConnection('confirmed');

  // Resolve pool + vaults + extras (may use cache for known pools)
  const resolved = await resolvePoolFull({ baseMint, quoteMint: WSOL_MINT, user: wallet.publicKey.toBase58() });
  if(!resolved.ok) throw new Error(`resolve failed: ${resolved.error}`);

  const pool = resolved.pool;
  const poolState = resolved.poolState;
  const ex = resolved.extras;

  // Determine token programs
  const baseTokenProgram = ex.baseTokenProgram || TOKEN_2022_PROGRAM_ID.toBase58();
  const quoteTokenProgram = ex.quoteTokenProgram || TOKEN_PROGRAM_ID.toBase58();

  // Associated token accounts
  const baseAta = getAssociatedTokenAddressSync(pk(baseMint), wallet.publicKey, false, pk(baseTokenProgram));
  const wsolMint = pk(WSOL_MINT);
  const wsolAta = getAssociatedTokenAddressSync(wsolMint, wallet.publicKey, false, pk(quoteTokenProgram));

  // Amounts (fee deducted from gross input; fee transfer done in same tx at end)
  const lamportsGross = BigInt(Math.round(solAmount * 1e9));
  const feeLamports = feeTo ? computeFeeLamports({ amountLamports: lamportsGross, feeBps }) : 0n;
  const lamportsNet = lamportsGross - feeLamports;
  if (lamportsNet <= 0n) throw new Error('fee leaves no SOL for swap');

  const maxInLamports = BigInt(Math.ceil(Number(lamportsNet) * (1 + slippagePct / 100)));
  // Quote to set safer minOut
  const { quoteBuyBaseOut } = await import('./quote.mjs');
  const q = await quoteBuyBaseOut({
    quoteInLamports: lamportsNet,
    poolBaseTokenAccount: poolState.poolBaseTokenAccount,
    poolQuoteTokenAccount: poolState.poolQuoteTokenAccount,
    slippageBps: Math.round(slippagePct * 100),
  });
  const minOutTokens = q.minOutRaw > 0n ? q.minOutRaw : 1n;

  if (!resolved.userVolumeAccumulator || Array.isArray(resolved.userVolumeAccumulator)) {
    throw new Error('userVolumeAccumulator not resolved as a single pubkey (need cache or better resolver)');
  }

  const accounts = {
    pool,
    user: wallet.publicKey.toBase58(),
    globalConfig: ex.globalConfig,
    baseMint: poolState.baseMint,
    quoteMint: poolState.quoteMint,
    userBaseTokenAccount: baseAta.toBase58(),
    userQuoteTokenAccount: wsolAta.toBase58(),
    poolBaseTokenAccount: poolState.poolBaseTokenAccount,
    poolQuoteTokenAccount: poolState.poolQuoteTokenAccount,
    protocolFeeRecipient: ex.protocolFeeRecipient,
    protocolFeeRecipientTokenAccount: ex.protocolFeeRecipientTokenAccount,
    baseTokenProgram,
    quoteTokenProgram,
    systemProgram: SystemProgram.programId.toBase58(),
    associatedTokenProgram: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    eventAuthority: ex.eventAuthority,
    pumpswapProgram: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
    coinCreatorVaultAta: ex.coinCreatorVaultAta,
    coinCreatorVaultAuthority: ex.coinCreatorVaultAuthority,
    globalVolumeAccumulator: ex.globalVolumeAccumulator,
    userVolumeAccumulator: resolved.userVolumeAccumulator,
    feeConfig: ex.feeConfig,
    feeProgram: ex.feeProgram,
  };

  // Build instructions
  const ixs = [];
  // compute budget (similar to observed txs)
  ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));

  // create base ATA idempotent (Token-2022 aware)
  ixs.push(createAssociatedTokenAccountIdempotentInstruction(
    wallet.publicKey,
    baseAta,
    wallet.publicKey,
    pk(baseMint),
    pk(baseTokenProgram)
  ));

  // create WSOL ATA idempotent
  ixs.push(createAssociatedTokenAccountIdempotentInstruction(
    wallet.publicKey,
    wsolAta,
    wallet.publicKey,
    wsolMint,
    pk(quoteTokenProgram)
  ));

  // fund WSOL ATA
  ixs.push(SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: wsolAta,
    lamports: Number(maxInLamports),
  }));
  ixs.push(createSyncNativeInstruction(wsolAta, pk(quoteTokenProgram)));

  // pumpswap buy
  ixs.push(buildBuyIx({
    minOutTokens,
    maxInLamports,
    flags: 1,
    accounts,
  }));

  // close WSOL ATA to reclaim leftovers
  ixs.push(createCloseAccountInstruction(
    wsolAta,
    wallet.publicKey,
    wallet.publicKey,
    [],
    pk(quoteTokenProgram)
  ));

  // fee transfer LAST (atomic)
  const feeIx = feeTo ? buildFeeTransferIx({ fromPubkey: wallet.publicKey, toPubkey: feeTo, lamports: feeLamports }) : null;
  if (feeIx) ixs.push(feeIx);

  async function sendWithRefresh(attempts = 4) {
    let lastErr = null;
    for (let a = 1; a <= attempts; a++) {
      const bh = await conn.getLatestBlockhash('confirmed');
      const msg = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: bh.blockhash,
        instructions: ixs,
      }).compileToV0Message();

      const tx = new VersionedTransaction(msg);
      tx.sign([wallet]);

      try {
        const sig = await conn.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
        const conf = await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
        if (conf.value.err) throw new Error(`confirm err: ${JSON.stringify(conf.value.err)}`);
        return { sig, confirmed: true };
      } catch (e) {
        const msg = String(e?.message || e);
        lastErr = e;
        if (msg.toLowerCase().includes('block height exceeded') || msg.toLowerCase().includes('blockhash not found') || msg.toLowerCase().includes('expired')) {
          continue;
        }
        throw e;
      }
    }
    throw lastErr || new Error('send failed');
  }

  if (simulateOnly) {
    const bh = await conn.getLatestBlockhash('confirmed');
    const msg = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: bh.blockhash,
      instructions: ixs,
    }).compileToV0Message();
    const tx = new VersionedTransaction(msg);
    tx.sign([wallet]);
    const sim = await conn.simulateTransaction(tx, { replaceRecentBlockhash: true, sigVerify: false, commitment: 'confirmed' });
    console.log(JSON.stringify({
      ok: true,
      action: 'buy_simulate',
      baseMint,
      pool,
      solAmount,
      solAmountGross: Number(solAmount),
      solAmountNet: Number(lamportsNet) / 1e9,
      feeTo: feeTo || null,
      feeBps: feeTo ? feeBps : null,
      feeLamports: feeTo ? feeLamports.toString() : '0',
      slippagePct,
      maxInLamports: maxInLamports.toString(),
      minOutTokens: minOutTokens.toString(),
      err: sim.value.err || null,
      accountKeys: (msg.staticAccountKeys || []).map(k => k.toBase58()),
      logs: sim.value.logs || [],
      rpcUrl,
    }, null, 2));
    return;
  }

  const sent = await sendWithRefresh(5);

  console.log(JSON.stringify({
    ok: true,
    action: 'buy',
    baseMint,
    pool,
    solAmount,
    solAmountGross: Number(solAmount),
    solAmountNet: Number(lamportsNet) / 1e9,
    feeTo: feeTo || null,
    feeBps: feeTo ? feeBps : null,
    feeLamports: feeTo ? feeLamports.toString() : '0',
    slippagePct,
    maxInLamports: maxInLamports.toString(),
    minOutTokens: minOutTokens.toString(),
    signature: sent.sig,
    confirmed: sent.confirmed,
    rpcUrl,
  }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
