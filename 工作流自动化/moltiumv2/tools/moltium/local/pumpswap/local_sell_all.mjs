// Local pumpswap SELL-ALL (no Moltium backend, no PumpPortal)
// Usage:
//   node tools/moltium/local/pumpswap/local_sell_all.mjs <baseMint> [slippagePct=10] [--fee-to <pubkey>] [--fee-bps 30] [--simulate]

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
import { buildSellIx } from './build.mjs';
import { DEFAULT_FEE_TO, DEFAULT_FEE_BPS, computeFeeLamports, buildFeeTransferIx } from '../fees/sol_fee.mjs';

function pk(s){ return new PublicKey(String(s)); }

async function getTokenBalanceRaw({ conn, owner, mint, tokenProgramId }) {
  const ata = getAssociatedTokenAddressSync(pk(mint), owner, false, pk(tokenProgramId));
  const bal = await conn.getTokenAccountBalance(ata, 'confirmed').catch(() => null);
  if (!bal?.value?.amount) return { ata, raw: 0n, decimals: 0 };
  return { ata, raw: BigInt(bal.value.amount), decimals: Number(bal.value.decimals) };
}

async function main(){
  const argv = process.argv.slice(2);
  const simulateOnly = argv.includes('--simulate');

  function arg(name) {
    const i = argv.indexOf(name);
    return i !== -1 ? argv[i + 1] : null;
  }

  const feeTo = arg('--fee-to') || process.env.MOLTIUM_FEE_TO || DEFAULT_FEE_TO;
  const feeBps = arg('--fee-bps') ? Number(arg('--fee-bps')) : (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : DEFAULT_FEE_BPS);

  // positional args: <baseMint> [slippagePct]
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--simulate') continue;
    if (a === '--fee-to' || a === '--fee-bps') { i++; continue; }
    if (a.startsWith('--')) continue;
    positional.push(a);
  }
  const [baseMint, slipStr] = positional;
  if(!baseMint){
    console.error('usage: local_sell_all.mjs <baseMint> [slippagePct=10] [--simulate]');
    process.exit(2);
  }

  const slippagePct = slipStr ? Number(slipStr) : 10;

  const wallet = loadWalletKeypair();
  const { conn, rpcUrl } = getConnection('confirmed');

  const resolved = await resolvePoolFull({ baseMint, quoteMint: WSOL_MINT, user: wallet.publicKey.toBase58() });
  if(!resolved.ok) throw new Error(`resolve failed: ${resolved.error}`);

  const pool = resolved.pool;
  const poolState = resolved.poolState;
  const ex = resolved.extras;

  const baseTokenProgram = ex.baseTokenProgram || TOKEN_2022_PROGRAM_ID.toBase58();
  const quoteTokenProgram = ex.quoteTokenProgram || TOKEN_PROGRAM_ID.toBase58();

  // ATAs
  const wsolMint = pk(WSOL_MINT);
  const wsolAta = getAssociatedTokenAddressSync(wsolMint, wallet.publicKey, false, pk(quoteTokenProgram));

  const { ata: baseAta, raw: inTokenRaw } = await getTokenBalanceRaw({
    conn,
    owner: wallet.publicKey,
    mint: baseMint,
    tokenProgramId: baseTokenProgram,
  });

  if (inTokenRaw <= 0n) {
    console.log(JSON.stringify({ ok: true, action: 'sell_all', baseMint, pool, slippagePct, note: 'No token balance to sell', signature: null, rpcUrl }, null, 2));
    return;
  }

  // Quote to set safer minOut
  const { quoteSellQuoteOut } = await import('./quote.mjs');
  const q = await quoteSellQuoteOut({
    baseInRaw: inTokenRaw,
    poolBaseTokenAccount: poolState.poolBaseTokenAccount,
    poolQuoteTokenAccount: poolState.poolQuoteTokenAccount,
    slippageBps: Math.round(slippagePct * 100),
  });
  const minOutLamports = q.minOutLamports > 0n ? q.minOutLamports : 1n;

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
    feeConfig: ex.feeConfig,
    feeProgram: ex.feeProgram,
  };

  const ixs = [];
  ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));

  // Ensure WSOL ATA exists for receiving SOL as WSOL then close.
  ixs.push(createAssociatedTokenAccountIdempotentInstruction(
    wallet.publicKey,
    wsolAta,
    wallet.publicKey,
    wsolMint,
    pk(quoteTokenProgram)
  ));

  // SELL
  ixs.push(buildSellIx({ inTokenRaw, minOutLamports, accounts }));

  // Sync + close WSOL ATA to reclaim SOL
  ixs.push(createSyncNativeInstruction(wsolAta, pk(quoteTokenProgram)));
  ixs.push(createCloseAccountInstruction(
    wsolAta,
    wallet.publicKey,
    wallet.publicKey,
    [],
    pk(quoteTokenProgram)
  ));

  // fee (conservative) based on minOutLamports, transferred in same tx
  const feeLamports = feeTo ? computeFeeLamports({ amountLamports: minOutLamports, feeBps }) : 0n;
  const feeIx = feeTo ? buildFeeTransferIx({ fromPubkey: wallet.publicKey, toPubkey: feeTo, lamports: feeLamports }) : null;
  if (feeIx) ixs.push(feeIx);

  async function sendWithRefresh(attempts = 3) {
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
        // if blockhash expired / block height exceeded, refresh and retry
        const m = msg.toLowerCase();
        if (m.includes('block height exceeded') || m.includes('blockhash not found') || m.includes('expired') || m.includes('timeout') || m.includes('node is behind')) {
          continue;
        }
        // otherwise don't spam retries
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
      action: 'sell_all_simulate',
      baseMint,
      pool,
      slippagePct,
      inTokenRaw: inTokenRaw.toString(),
      minOutLamports: minOutLamports.toString(),
      feeTo: feeTo || null,
      feeBps: feeTo ? feeBps : null,
      feeLamports: feeTo ? feeLamports.toString() : '0',
      err: sim.value.err || null,
      accountKeys: (msg.staticAccountKeys || []).map(k => k.toBase58()),
      logs: sim.value.logs || [],
      rpcUrl,
    }, null, 2));
    return;
  }

  const sent = await sendWithRefresh(7);

  console.log(JSON.stringify({
    ok: true,
    action: 'sell_all',
    baseMint,
    pool,
    slippagePct,
    inTokenRaw: inTokenRaw.toString(),
    minOutLamports: minOutLamports.toString(),
    feeTo: feeTo || null,
    feeBps: feeTo ? feeBps : null,
    feeLamports: feeTo ? feeLamports.toString() : '0',
    signature: sent.sig,
    confirmed: sent.confirmed,
    rpcUrl,
  }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
