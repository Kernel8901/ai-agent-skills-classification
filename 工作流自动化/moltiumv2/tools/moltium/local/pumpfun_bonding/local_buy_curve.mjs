// Local pump.fun bonding curve BUY (complete=false only)
// Usage: node tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs <mint> <solAmount> <creatorPubkey> [slippagePct=10] [--fee-to <pubkey>] [--fee-bps 30] [--cu-limit N] [--cu-price microLamports] [--simulate]

import { PublicKey, SystemProgram, ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

import { getConnection } from '../rpc/connection.mjs';
import { loadWalletKeypair } from '../wallet.mjs';
import { DEFAULT_FEE_TO, DEFAULT_FEE_BPS, computeFeeLamports, buildFeeTransferIx } from '../fees/sol_fee.mjs';
import { bondingCurveGetBuyPrice } from './borsh_accounts.mjs';
import { buildBuyIx } from './build.mjs';
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
  const feeBps = feeBpsIx !== -1 ? Number(argv[feeBpsIx + 1]) : (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : DEFAULT_FEE_BPS);

  const filtered = argv.filter((a, i) => {
    if (a === '--simulate') return false;
    if (cuPriceIx !== -1 && (i === cuPriceIx || i === cuPriceIx + 1)) return false;
    if (cuLimitIx !== -1 && (i === cuLimitIx || i === cuLimitIx + 1)) return false;
    if (feeToIx !== -1 && (i === feeToIx || i === feeToIx + 1)) return false;
    if (feeBpsIx !== -1 && (i === feeBpsIx || i === feeBpsIx + 1)) return false;
    return true;
  });

  const [mint, solAmountStr, creator, slipStr] = filtered;
  if (process.env.DEBUG_BUY === '1') {
    console.log(JSON.stringify({ debug: true, argv, filtered, mint, solAmountStr, creator, slipStr, cuPrice, cuLimit, cuPriceIx, cuLimitIx }, null, 2));
  }
  if(!mint || !solAmountStr || !creator){
    console.error('usage: local_buy_curve.mjs <mint> <solAmount> <creatorPubkey> [slippagePct=10] [--cu-limit N] [--cu-price microLamports] [--simulate]');
    process.exit(2);
  }
  const solAmount = Number(solAmountStr);
  const slippagePct = slipStr ? Number(slipStr) : 10;

  const wallet = loadWalletKeypair();
  // Use processed for fresher blockhashes; confirm at confirmed.
  const { conn, rpcUrl } = getConnection('processed');

  const r = await resolveBonding({ mint, userPubkey: wallet.publicKey.toBase58(), creatorPubkey: creator });
  if (r.curveAcc.complete) throw new Error('Bonding curve complete; use pumpswap instead');

  // Fee model (BUY): deduct + atomic same-tx fee transfer.
  const lamportsGross = BigInt(Math.round(solAmount * 1e9));
  const feeLamports = feeTo ? computeFeeLamports({ amountLamports: lamportsGross, feeBps }) : 0n;
  const lamportsNet = lamportsGross - feeLamports;
  if (lamportsNet <= 0n) throw new Error('fee leaves no SOL for buy');

  const maxSolCost = BigInt(Math.ceil(Number(lamportsNet) * (1 + slippagePct/100)));

  // quote token out from curve using NET input and apply slippage on token out (min)
  const expectedOut = bondingCurveGetBuyPrice(r.curveAcc, lamportsNet);
  const minOut = (expectedOut * (10_000n - BigInt(Math.round(slippagePct*100)))) / 10_000n;

  const tokenProgramPk = pk(r.tokenProgram);
  const splTokenProgramId = tokenProgramPk.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  // Ensure user's ATA exists
  const userAta = getAssociatedTokenAddressSync(pk(mint), wallet.publicKey, false, splTokenProgramId);

  const ixs = [];
  ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: Number.isFinite(cuLimit) && cuLimit > 0 ? cuLimit : 200_000 }));
  if (Number.isFinite(cuPrice) && cuPrice > 0) {
    ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: cuPrice }));
  }
  ixs.push(createAssociatedTokenAccountIdempotentInstruction(
    wallet.publicKey,
    userAta,
    wallet.publicKey,
    pk(mint),
    splTokenProgramId
  ));

  ixs.push(buildBuyIx({
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
    globalVolumeAccumulator: r.globalVolumeAccumulator,
    userVolumeAccumulator: r.userVolumeAccumulator,
    feeConfig: r.feeConfig,
    feeProgram: r.feeProgram,
    amountTokensRaw: minOut,
    maxSolCostLamports: maxSolCost,
  }));

  // fee transfer LAST (atomic)
  const feeIx = feeTo ? buildFeeTransferIx({ fromPubkey: wallet.publicKey, toPubkey: feeTo, lamports: feeLamports }) : null;
  if (feeIx) ixs.push(feeIx);

  async function sendWithRefresh(attempts = 5) {
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
        const sig = await conn.sendTransaction(tx, {
          skipPreflight: true,
          preflightCommitment: 'processed',
          maxRetries: 10,
        });
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
    console.log(JSON.stringify({ ok:true, action:'buy_curve_simulate', mint, solAmount, solAmountGross: Number(lamportsGross)/1e9, solAmountNet: Number(lamportsNet)/1e9, slippagePct, expectedOut: expectedOut.toString(), minOut: minOut.toString(), maxSolCost: maxSolCost.toString(), feeTo: feeTo || null, feeBps: feeTo ? feeBps : null, feeLamports: feeTo ? feeLamports.toString() : '0', err: sim.value.err || null, accountKeys: (msg.staticAccountKeys||[]).map(k=>k.toBase58()), logs: sim.value.logs || [], rpcUrl }, null, 2));
    return;
  }

  const sig = await sendWithRefresh();
  console.log(JSON.stringify({ ok:true, action:'buy_curve', mint, solAmount, solAmountGross: Number(lamportsGross)/1e9, solAmountNet: Number(lamportsNet)/1e9, slippagePct, expectedOut: expectedOut.toString(), minOut: minOut.toString(), maxSolCost: maxSolCost.toString(), feeTo: feeTo || null, feeBps: feeTo ? feeBps : null, feeLamports: feeTo ? feeLamports.toString() : '0', signature: sig, rpcUrl }, null, 2));
}

main().catch(e=>{ console.error(e?.stack || String(e?.message||e)); process.exit(1); });
