// Raydium AMM v4 BUY (fixed-in)
// Usage:
//   node tools/moltium/local/raydium/local_buy.mjs --amm <ammId> --sol 0.2 --slippage 10 \
//     [--fee-to <pubkey>] [--fee-bps 30] [--cu-price 666666] [--cu-limit 250000] [--simulate]

import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import { getConnection } from '../rpc/connection.mjs';
import { loadWalletKeypair } from '../wallet.mjs';
import { WSOL_MINT } from '../pumpswap/resolve.mjs';

import { fetchRaydiumAmmV4PoolKeysByAmmId } from './amm_v4/poolkeys_from_ammid.mjs';
import { quoteSwapFixedIn } from './amm_v4/quote_fixed_in.mjs';
import { buildRaydiumAmmV4SwapFixedInIx } from './amm_v4/swap_fixed_in_ix.mjs';
import { buildComputeBudgetIxs, sendV0TxWithRefresh, simulateV0Tx } from './amm_v4/tx_send.mjs';

import {
  DEFAULT_FEE_TO,
  DEFAULT_FEE_BPS,
  computeFeeLamports,
  buildFeeTransferIx,
} from '../fees/sol_fee.mjs';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

function lamportsToSolStr(lamports) {
  const n = BigInt(lamports);
  const whole = n / 1_000_000_000n;
  const frac = n % 1_000_000_000n;
  return `${whole}.${frac.toString().padStart(9, '0')}`;
}

const ammId = arg('--amm');
const solStr = arg('--sol');
const slipStr = arg('--slippage') || '10';
const simulate = process.argv.includes('--simulate');

const feeTo = arg('--fee-to') || process.env.MOLTIUM_FEE_TO || DEFAULT_FEE_TO;
const feeBps = arg('--fee-bps')
  ? Number(arg('--fee-bps'))
  : (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : DEFAULT_FEE_BPS);

const cuPrice = arg('--cu-price') ? Number(arg('--cu-price')) : null;
const cuLimit = arg('--cu-limit') ? Number(arg('--cu-limit')) : 250000;

if (!ammId || !solStr) {
  console.error('usage: local_buy.mjs --amm <ammId> --sol <amount> --slippage <pct> [--fee-to <pubkey>] [--fee-bps 30] [--cu-price N] [--cu-limit N] [--simulate]');
  process.exit(2);
}

const solAmountGross = Number(solStr);
const slippagePct = Number(slipStr);
const slippageBps = Math.round(slippagePct * 100);

const wallet = loadWalletKeypair();
const { conn, rpcUrl } = getConnection('processed');

const poolKeys = await fetchRaydiumAmmV4PoolKeysByAmmId(conn, ammId);

// Determine direction: spend SOL (WSOL) to buy the other mint in this pool.
const wsol = new PublicKey(WSOL_MINT);
const baseIsWsol = poolKeys.baseMint.equals(wsol);
const quoteIsWsol = poolKeys.quoteMint.equals(wsol);
if (!baseIsWsol && !quoteIsWsol) {
  throw new Error('Pool is not SOL-quoted (WSOL not found in base/quote). This MVP only supports SOL<->token.');
}

const inMint = wsol;
const outMint = baseIsWsol ? poolKeys.quoteMint : poolKeys.baseMint;
const inDecimals = 9;
const outDecimals = baseIsWsol ? poolKeys.quoteDecimals : poolKeys.baseDecimals;

const lamportsGross = BigInt(Math.round(solAmountGross * 1e9));
const feeLamports = computeFeeLamports({ amountLamports: lamportsGross, feeBps });
const lamportsNet = lamportsGross - feeLamports;
if (lamportsNet <= 0n) throw new Error('fee exceeds input amount');

// Quote uses NET input (deduct mode)
const q = await quoteSwapFixedIn({
  conn,
  poolKeys,
  inMint,
  inDecimals,
  outMint,
  outDecimals,
  amountInUi: lamportsToSolStr(lamportsNet),
  slippageBps,
});

const minOutRaw = BigInt(q.minAmountOut.raw.toString());

// Token accounts
const wsolAta = getAssociatedTokenAddressSync(wsol, wallet.publicKey, false, TOKEN_PROGRAM_ID);
const outAta = getAssociatedTokenAddressSync(outMint, wallet.publicKey, false, TOKEN_PROGRAM_ID);

const ixs = [];
ixs.push(...buildComputeBudgetIxs({ cuLimit, cuPrice }));

// Ensure ATAs
ixs.push(createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, wsolAta, wallet.publicKey, wsol, TOKEN_PROGRAM_ID));
ixs.push(createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, outAta, wallet.publicKey, outMint, TOKEN_PROGRAM_ID));

// Wrap NET SOL into WSOL ATA
ixs.push(SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: wsolAta, lamports: Number(lamportsNet) }));
ixs.push(createSyncNativeInstruction(wsolAta, TOKEN_PROGRAM_ID));

// Swap WSOL -> outMint
ixs.push(buildRaydiumAmmV4SwapFixedInIx({
  poolKeys,
  owner: wallet.publicKey,
  tokenAccountIn: wsolAta,
  tokenAccountOut: outAta,
  amountInRaw: lamportsNet,
  minAmountOutRaw: minOutRaw,
}));

// Close WSOL ATA to reclaim dust SOL
ixs.push(createCloseAccountInstruction(wsolAta, wallet.publicKey, wallet.publicKey, [], TOKEN_PROGRAM_ID));

// Fee transfer LAST (deducted from gross amount)
const feeIx = buildFeeTransferIx({ fromPubkey: wallet.publicKey, toPubkey: feeTo, lamports: feeLamports });
if (feeIx) ixs.push(feeIx);

if (simulate) {
  const sim = await simulateV0Tx({ conn, payer: wallet.publicKey, signers: [wallet], ixs });
  console.log(JSON.stringify({
    ok: true,
    action: 'raydium_buy_simulate',
    ammId,
    solAmountGross,
    solAmountNet: Number(lamportsNet) / 1e9,
    slippagePct,
    minOutRaw: minOutRaw.toString(),
    feeTo,
    feeBps,
    feeLamports: feeLamports.toString(),
    err: sim.err || null,
    accountKeys: sim.accountKeys || [],
    logs: sim.logs || [],
    rpcUrl,
  }, null, 2));
  process.exit(0);
}

const sig = await sendV0TxWithRefresh({ conn, payer: wallet.publicKey, signers: [wallet], ixs });
console.log(JSON.stringify({
  ok: true,
  action: 'raydium_buy',
  ammId,
  solAmountGross,
  solAmountNet: Number(lamportsNet) / 1e9,
  slippagePct,
  minOutRaw: minOutRaw.toString(),
  feeTo,
  feeBps,
  feeLamports: feeLamports.toString(),
  signature: sig,
  rpcUrl,
}, null, 2));
