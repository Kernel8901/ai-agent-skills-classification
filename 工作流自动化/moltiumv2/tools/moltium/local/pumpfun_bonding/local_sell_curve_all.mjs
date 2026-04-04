// Local pump.fun bonding curve SELL-ALL (complete=false only)
// Usage: node tools/moltium/local/pumpfun_bonding/local_sell_curve_all.mjs <mint> <creatorPubkey> [slippagePct=10] [--fee-to <pubkey>] [--fee-bps 30] [--cu-limit N] [--cu-price microLamports] [--simulate]

import { PublicKey, ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { DEFAULT_FEE_TO, DEFAULT_FEE_BPS, computeFeeLamports, buildFeeTransferIx } from '../fees/sol_fee.mjs';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

import { getConnection } from '../rpc/connection.mjs';
import { loadWalletKeypair } from '../wallet.mjs';
import { bondingCurveGetSellPrice } from './borsh_accounts.mjs';
import { buildSellIx } from './build.mjs';
import { resolveBonding } from './resolve.mjs';

function pk(s){ return new PublicKey(String(s)); }

async function main(){
  const argv = process.argv.slice(2);
  const simulateOnly = argv.includes('--simulate');
  const cuPriceIx = argv.findIndex(a => a === '--cu-price');
  const cuLimitIx = argv.findIndex(a => a === '--cu-limit');
  const feeToIx = argv.findIndex(a => a === '--fee-to');
  const feeBpsIx = argv.findIndex(a => a === '--fee-bps');
  const cuPrice = cuPriceIx !== -1 ? Number(argv[cuPriceIx + 1]) : null; // microLamports per CU
  const cuLimit = cuLimitIx !== -1 ? Number(argv[cuLimitIx + 1]) : null;
  const feeTo = feeToIx !== -1 ? String(argv[feeToIx + 1]) : (process.env.MOLTIUM_FEE_TO || DEFAULT_FEE_TO);
  const feeBpsUser = feeBpsIx !== -1 ? Number(argv[feeBpsIx + 1]) : (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : DEFAULT_FEE_BPS);

  const filtered = argv.filter((a, i) => {
    if (a === '--simulate') return false;
    if (cuPriceIx !== -1 && (i === cuPriceIx || i === cuPriceIx + 1)) return false;
    if (cuLimitIx !== -1 && (i === cuLimitIx || i === cuLimitIx + 1)) return false;
    if (feeToIx !== -1 && (i === feeToIx || i === feeToIx + 1)) return false;
    if (feeBpsIx !== -1 && (i === feeBpsIx || i === feeBpsIx + 1)) return false;
    return true;
  });

  const [mint, creator, slipStr] = filtered;
  if(!mint || !creator){
    console.error('usage: local_sell_curve_all.mjs <mint> <creatorPubkey> [slippagePct=10] [--cu-limit N] [--cu-price microLamports] [--simulate]');
    process.exit(2);
  }
  const slippagePct = slipStr ? Number(slipStr) : 10;

  const wallet = loadWalletKeypair();
  // Use processed for fresher blockhashes; confirm at confirmed.
  const { conn, rpcUrl } = getConnection('processed');

  const r = await resolveBonding({ mint, userPubkey: wallet.publicKey.toBase58(), creatorPubkey: creator });
  if (r.curveAcc.complete) throw new Error('Bonding curve complete; use pumpswap instead');

  const tokenProgramPk = pk(r.tokenProgram);
  const splTokenProgramId = tokenProgramPk.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  const userAta = getAssociatedTokenAddressSync(pk(mint), wallet.publicKey, false, splTokenProgramId);

  const bal = await conn.getTokenAccountBalance(userAta, 'confirmed').catch(()=>null);
  const inTokenRaw = bal?.value?.amount ? BigInt(bal.value.amount) : 0n;
  if (inTokenRaw <= 0n) {
    console.log(JSON.stringify({ ok:true, action:'sell_curve_all', mint, slippagePct, note:'No token balance to sell', signature: null, rpcUrl }, null, 2));
    return;
  }

  const feeBpsProtocol = BigInt(r.globalAcc.feeBasisPoints);
  const expectedSol = bondingCurveGetSellPrice(r.curveAcc, inTokenRaw, feeBpsProtocol);
  const minSol = (expectedSol * (10_000n - BigInt(Math.round(slippagePct*100)))) / 10_000n;

  // Fee model (SELL): conservative minOut-based + atomic
  const feeLamports = feeTo ? computeFeeLamports({ amountLamports: minSol, feeBps: feeBpsUser }) : 0n;

  const ixs = [];
  ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: Number.isFinite(cuLimit) && cuLimit > 0 ? cuLimit : 200_000 }));
  if (Number.isFinite(cuPrice) && cuPrice > 0) {
    ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: cuPrice }));
  }
  // ensure ata exists
  ixs.push(createAssociatedTokenAccountIdempotentInstruction(
    wallet.publicKey,
    userAta,
    wallet.publicKey,
    pk(mint),
    splTokenProgramId
  ));

  ixs.push(buildSellIx({
    tokenProgram: r.tokenProgram,
    global: r.global,
    feeRecipient: r.feeRecipient,
    mint,
    bondingCurve: r.bondingCurve,
    associatedBondingCurve: r.associatedBondingCurve,
    associatedUser: userAta.toBase58(),
    user: wallet.publicKey.toBase58(),
    creatorVault: r.creatorVault,
    eventAuthority: r.eventAuthority,
    feeConfig: r.feeConfig,
    feeProgram: r.feeProgram,
    amountTokensRaw: inTokenRaw,
    minSolOutLamports: minSol,
  }));

  // fee transfer LAST (atomic)
  const feeIx = feeTo ? buildFeeTransferIx({ fromPubkey: wallet.publicKey, toPubkey: feeTo, lamports: feeLamports }) : null;
  if (feeIx) ixs.push(feeIx);

  async function sendWithRefresh(attempts = 7) {
    let lastErr = null;
    for (let a = 1; a <= attempts; a++) {
      const bh = await conn.getLatestBlockhash('processed');
      const msg = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: bh.blockhash,
        instructions: ixs,
      }).compileToV0Message();
      const tx = new VersionedTransaction(msg);
      tx.sign([wallet]);
      try {
        const sig = await conn.sendTransaction(tx, { skipPreflight: true, preflightCommitment: 'processed', maxRetries: 10 });
        const conf = await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
        if (conf.value.err) throw new Error(`confirm err: ${JSON.stringify(conf.value.err)}`);
        return sig;
      } catch (e) {
        lastErr = e;
        const m = String(e?.message||e).toLowerCase();
        if (m.includes('block height exceeded') || m.includes('blockhash not found') || m.includes('expired')) continue;
        throw e;
      }
    }
    throw lastErr;
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
    console.log(JSON.stringify({ ok:true, action:'sell_curve_all_simulate', mint, slippagePct, inTokenRaw: inTokenRaw.toString(), expectedSol: expectedSol.toString(), minSol: minSol.toString(), feeTo: feeTo || null, feeBps: feeTo ? feeBpsUser : null, feeLamports: feeTo ? feeLamports.toString() : '0', err: sim.value.err || null, accountKeys: (msg.staticAccountKeys||[]).map(k=>k.toBase58()), logs: sim.value.logs || [], rpcUrl }, null, 2));
    return;
  }

  const sig = await sendWithRefresh();

  console.log(JSON.stringify({ ok:true, action:'sell_curve_all', mint, slippagePct, inTokenRaw: inTokenRaw.toString(), expectedSol: expectedSol.toString(), minSol: minSol.toString(), feeTo: feeTo || null, feeBps: feeTo ? feeBpsUser : null, feeLamports: feeTo ? feeLamports.toString() : '0', signature: sig, rpcUrl }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
