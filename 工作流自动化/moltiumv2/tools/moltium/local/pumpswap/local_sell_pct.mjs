// Local pumpswap SELL by percentage (no Moltium backend, no PumpPortal)
// Usage:
//   node tools/moltium/local/pumpswap/local_sell_pct.mjs <baseMint> <percent> [slippagePct=10] [--simulate]

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

function pk(s){ return new PublicKey(String(s)); }

async function getTokenBalanceRaw({ conn, owner, mint, tokenProgramId }) {
  const ata = getAssociatedTokenAddressSync(pk(mint), owner, false, pk(tokenProgramId));
  const bal = await conn.getTokenAccountBalance(ata, 'confirmed').catch(() => null);
  if (!bal?.value?.amount) return { ata, raw: 0n, decimals: 0 };
  return { ata, raw: BigInt(bal.value.amount), decimals: Number(bal.value.decimals) };
}

function pctOf(amount, pct) {
  const p = BigInt(Math.round(pct));
  if (p <= 0n) return 0n;
  if (p >= 100n) return amount;
  const out = (amount * p) / 100n;
  return out <= 0n && amount > 0n ? 1n : out;
}

async function main(){
  const argv = process.argv.slice(2);
  const simulateOnly = argv.includes('--simulate');
  const filtered = argv.filter(a => a !== '--simulate');
  const [baseMint, percentStr, slipStr] = filtered;

  if(!baseMint || !percentStr){
    console.error('usage: local_sell_pct.mjs <baseMint> <percent> [slippagePct=10] [--simulate]');
    process.exit(2);
  }

  const percent = Number(percentStr);
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) throw new Error('bad percent');

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

  const wsolMint = pk(WSOL_MINT);
  const wsolAta = getAssociatedTokenAddressSync(wsolMint, wallet.publicKey, false, pk(quoteTokenProgram));

  const { ata: baseAta, raw: balanceRaw } = await getTokenBalanceRaw({
    conn,
    owner: wallet.publicKey,
    mint: baseMint,
    tokenProgramId: baseTokenProgram,
  });

  if (balanceRaw <= 0n) throw new Error('No token balance to sell');
  const inTokenRaw = pctOf(balanceRaw, percent);

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
  ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 250_000 }));

  // ensure WSOL ATA exists
  ixs.push(createAssociatedTokenAccountIdempotentInstruction(
    wallet.publicKey,
    wsolAta,
    wallet.publicKey,
    wsolMint,
    pk(quoteTokenProgram),
  ));

  // sync WSOL
  ixs.push(SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: wsolAta, lamports: 0 }));
  ixs.push(createSyncNativeInstruction(wsolAta, pk(quoteTokenProgram)));

  // build sell ix
  ixs.push(buildSellIx({
    inTokenRaw,
    minOutLamports,
    accounts,
  }));

  // close WSOL ATA (refund rent)
  ixs.push(createCloseAccountInstruction(wsolAta, wallet.publicKey, wallet.publicKey, [], pk(quoteTokenProgram)));

  async function sendWithRefresh(attempts = 7) {
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
        lastErr = e;
        const m = String(e?.message || e).toLowerCase();
        if (m.includes('block height exceeded') || m.includes('blockhash not found') || m.includes('expired') || m.includes('timeout') || m.includes('node is behind')) continue;
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
    console.log(JSON.stringify({ ok:true, action:'sell_pct_simulate', baseMint, percent, slippagePct, balanceRaw: balanceRaw.toString(), inTokenRaw: inTokenRaw.toString(), minOutLamports: minOutLamports.toString(), err: sim.value.err || null, logs: sim.value.logs || [], rpcUrl }, null, 2));
    return;
  }

  const sent = await sendWithRefresh(7);
  console.log(JSON.stringify({ ok:true, action:'sell_pct', baseMint, percent, slippagePct, balanceRaw: balanceRaw.toString(), inTokenRaw: inTokenRaw.toString(), minOutLamports: minOutLamports.toString(), signature: sent.sig, confirmed: sent.confirmed, rpcUrl }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
