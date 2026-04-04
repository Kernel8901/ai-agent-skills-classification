// Raydium AMM v4 SELL-ALL (fixed-in)
// Usage:
//   node tools/moltium/local/raydium/local_sell_all.mjs --amm <ammId> --slippage 10 [--fee-to <pubkey>] [--fee-bps 30] [--cu-price 666666] [--cu-limit 250000] [--simulate]

import { PublicKey } from '@solana/web3.js';
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
import { computeFeeLamports, buildFeeTransferIx } from '../fees/sol_fee.mjs';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

const ammId = arg('--amm');
const slipStr = arg('--slippage') || '10';
const simulate = process.argv.includes('--simulate');

import { DEFAULT_FEE_TO, DEFAULT_FEE_BPS } from '../fees/sol_fee.mjs';

const feeTo = arg('--fee-to') || process.env.MOLTIUM_FEE_TO || DEFAULT_FEE_TO;
const feeBps = arg('--fee-bps') ? Number(arg('--fee-bps')) : (process.env.MOLTIUM_FEE_BPS ? Number(process.env.MOLTIUM_FEE_BPS) : DEFAULT_FEE_BPS);

const cuPrice = arg('--cu-price') ? Number(arg('--cu-price')) : null;
const cuLimit = arg('--cu-limit') ? Number(arg('--cu-limit')) : 250000;

if (!ammId) {
  console.error('usage: local_sell_all.mjs --amm <ammId> --slippage <pct> [--cu-price N] [--cu-limit N] [--simulate]');
  process.exit(2);
}

const slippagePct = Number(slipStr);
const slippageBps = Math.round(slippagePct * 100);

const wallet = loadWalletKeypair();
const { conn, rpcUrl } = getConnection('processed');

const poolKeys = await fetchRaydiumAmmV4PoolKeysByAmmId(conn, ammId);
const wsol = new PublicKey(WSOL_MINT);
const baseIsWsol = poolKeys.baseMint.equals(wsol);
const quoteIsWsol = poolKeys.quoteMint.equals(wsol);
if (!baseIsWsol && !quoteIsWsol) {
  throw new Error('Pool is not SOL-quoted (WSOL not found in base/quote). This MVP only supports SOL<->token.');
}

const inMint = baseIsWsol ? poolKeys.quoteMint : poolKeys.baseMint; // token we hold
const outMint = wsol;
const inDecimals = baseIsWsol ? poolKeys.quoteDecimals : poolKeys.baseDecimals;
const outDecimals = 9;

// user token balance
const inAta = getAssociatedTokenAddressSync(inMint, wallet.publicKey, false, TOKEN_PROGRAM_ID);
const bal = await conn.getTokenAccountBalance(inAta, 'confirmed').catch(() => null);
const inRaw = bal?.value?.amount ? BigInt(bal.value.amount) : 0n;
if (inRaw <= 0n) {
  console.log(JSON.stringify({ ok: true, action: 'raydium_sell_all', ammId, slippagePct, note: 'No token balance to sell', signature: null, rpcUrl }, null, 2));
  process.exit(0);
}

// quote for minOut
const q = await quoteSwapFixedIn({
  conn,
  poolKeys,
  inMint,
  inDecimals,
  outMint,
  outDecimals,
  amountInUi: (Number(inRaw) / 10 ** inDecimals),
  slippageBps,
});
const minOutRaw = BigInt(q.minAmountOut.raw.toString());

const wsolAta = getAssociatedTokenAddressSync(wsol, wallet.publicKey, false, TOKEN_PROGRAM_ID);

const ixs = [];
ixs.push(...buildComputeBudgetIxs({ cuLimit, cuPrice }));

ixs.push(createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, wsolAta, wallet.publicKey, wsol, TOKEN_PROGRAM_ID));

ixs.push(buildRaydiumAmmV4SwapFixedInIx({
  poolKeys,
  owner: wallet.publicKey,
  tokenAccountIn: inAta,
  tokenAccountOut: wsolAta,
  amountInRaw: inRaw,
  minAmountOutRaw: minOutRaw,
}));

ixs.push(createSyncNativeInstruction(wsolAta, TOKEN_PROGRAM_ID));
ixs.push(createCloseAccountInstruction(wsolAta, wallet.publicKey, wallet.publicKey, [], TOKEN_PROGRAM_ID));

// Fee-in-same-tx approach:
// We compute fee from minOutRaw (conservative). This ensures we never try to fee more than the guaranteed proceeds.
const feeLamports = feeTo ? computeFeeLamports({ amountLamports: minOutRaw, feeBps }) : 0n;

// Fee transfer LAST: after sync+close WSOL, wallet SOL should include the swap proceeds.
const feeIx = feeTo ? buildFeeTransferIx({ fromPubkey: wallet.publicKey, toPubkey: feeTo, lamports: feeLamports }) : null;
if (feeIx) ixs.push(feeIx);

if (simulate) {
  const sim = await simulateV0Tx({ conn, payer: wallet.publicKey, signers: [wallet], ixs });
  console.log(JSON.stringify({ ok: true, action: 'raydium_sell_all_simulate', ammId, slippagePct, inTokenRaw: inRaw.toString(), minOutRaw: minOutRaw.toString(), feeTo, feeBps, feeLamports: feeLamports.toString(), err: sim.err || null, accountKeys: sim.accountKeys || [], logs: sim.logs || [], rpcUrl }, null, 2));
  process.exit(0);
}

const sig = await sendV0TxWithRefresh({ conn, payer: wallet.publicKey, signers: [wallet], ixs });

console.log(JSON.stringify({ ok: true, action: 'raydium_sell_all', ammId, slippagePct, inTokenRaw: inRaw.toString(), minOutRaw: minOutRaw.toString(), feeTo: feeTo || null, feeBps: feeTo ? feeBps : null, feeLamports: feeTo ? feeLamports.toString() : '0', signature: sig, rpcUrl }, null, 2));
