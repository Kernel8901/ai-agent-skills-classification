// PumpSwap: claim creator fees (transfer creator fees to pump.fun)
// Usage:
//   node tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs [<anyBaseMintForSanityCheck>] [--simulate] [--cu-limit N] [--cu-price microLamports]
//
// Notes:
// - This is the "claim fee" action a dev wallet performs to withdraw accumulated creator fees.
// - Derived from on-chain tx example:
//   4VZEZobZd5K8mo4xXWoo7RDtK7TD818DWdnukdmTYz74Tkipzw8qXhBjmFW3gHMaB7voMLJTUL2s9VdqA9vvgQfi

import { PublicKey, ComputeBudgetProgram, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { getConnection } from '../rpc/connection.mjs';
import { loadWalletKeypair } from '../wallet.mjs';
import { WSOL_MINT } from '../pumpswap/resolve.mjs';
import { findEventAuthorityPda } from '../pumpswap/pda.mjs';
import { buildTransferCreatorFeesToPumpIx } from '../pumpswap/claim_creator_fees_ix.mjs';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

function pk(s) { return new PublicKey(String(s)); }

const anyBaseMint = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const simulateOnly = process.argv.includes('--simulate');
const cuLimit = arg('--cu-limit') ? Number(arg('--cu-limit')) : 200_000;
const cuPrice = arg('--cu-price') ? Number(arg('--cu-price')) : null;

// baseMint is not required; claim is creator-wide.
// Optionally pass any baseMint to sanity-check that this wallet is the creator for that mint.

const wallet = loadWalletKeypair();
const { conn, rpcUrl } = getConnection('confirmed');

// Optional sanity-check: if a baseMint is provided, verify this wallet is the mint creator (pump.fun bonding curve).
if (anyBaseMint) {
  const PUMPFUN_PROGRAM = pk('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from('bonding-curve'), pk(anyBaseMint).toBuffer()],
    PUMPFUN_PROGRAM
  );
  const info = await conn.getAccountInfo(bondingCurve, 'confirmed');
  if (!info?.data) throw new Error('bonding curve account not found for sanity-check mint');
  const buf = Buffer.from(info.data);
  const creator = new PublicKey(buf.subarray(49, 81)).toBase58();
  if (creator !== wallet.publicKey.toBase58()) {
    throw new Error(`This wallet is not the creator of the provided mint. mintCreator=${creator} wallet=${wallet.publicKey.toBase58()}`);
  }
}

// Derive PumpSwap creator vault authority PDA + its WSOL ATA.
const PROGRAM_PUMPSWAP = pk('pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA');
const [coinCreatorVaultAuthorityPk] = PublicKey.findProgramAddressSync(
  [Buffer.from('creator_vault'), wallet.publicKey.toBuffer()],
  PROGRAM_PUMPSWAP
);

const [eventAuthority] = findEventAuthorityPda();
// In local mode we treat quote token program as SPL Token for WSOL.
// (If PumpSwap ever uses Token-2022 WSOL, adjust here.)
const wsolAta = getAssociatedTokenAddressSync(pk(WSOL_MINT), coinCreatorVaultAuthorityPk, true);

// Derive pump.fun creator-vault PDA (seed: "creator-vault")
const PUMPFUN_PROGRAM = pk('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
const [pumpCreatorVault] = PublicKey.findProgramAddressSync(
  [Buffer.from('creator-vault'), wallet.publicKey.toBuffer()],
  PUMPFUN_PROGRAM
);

// Build claim ix (matches observed account order)
const ix = buildTransferCreatorFeesToPumpIx({
  wsolMint: WSOL_MINT,
  tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  systemProgram: SystemProgram.programId,
  associatedTokenProgram: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  coinCreator: wallet.publicKey, // dev wallet must sign
  coinCreatorVaultAuthority: coinCreatorVaultAuthorityPk,
  coinCreatorVaultAta: wsolAta,
  pumpCreatorVault: pumpCreatorVault.toBase58(),
  eventAuthority: eventAuthority,
  pumpswapProgram: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
});

const ixs = [ComputeBudgetProgram.setComputeUnitLimit({ units: cuLimit })];
if (cuPrice) ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: cuPrice }));
ixs.push(ix);

const bh = await conn.getLatestBlockhash('confirmed');
const msg = new TransactionMessage({
  payerKey: wallet.publicKey,
  recentBlockhash: bh.blockhash,
  instructions: ixs,
}).compileToV0Message();

const tx = new VersionedTransaction(msg);
tx.sign([wallet]);

if (simulateOnly) {
  const sim = await conn.simulateTransaction(tx, { replaceRecentBlockhash: true, sigVerify: false, commitment: 'confirmed' });
  console.log(JSON.stringify({
    ok: true,
    action: 'pumpswap_claim_creator_fees_simulate',
    anyBaseMint,
    coinCreator: wallet.publicKey.toBase58(),
    coinCreatorVaultAuthority: coinCreatorVaultAuthorityPk.toBase58(),
    coinCreatorVaultAta: wsolAta.toBase58(),
    pumpCreatorVault: pumpCreatorVault.toBase58(),
    err: sim.value.err || null,
    logs: sim.value.logs || [],
    rpcUrl,
  }, null, 2));
  process.exit(0);
}

const sig = await conn.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
const conf = await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
if (conf.value.err) throw new Error(`confirm err: ${JSON.stringify(conf.value.err)}`);

console.log(JSON.stringify({
  ok: true,
  action: 'pumpswap_claim_creator_fees',
  anyBaseMint,
  coinCreator: wallet.publicKey.toBase58(),
  coinCreatorVaultAuthority: coinCreatorVaultAuthorityPk.toBase58(),
  coinCreatorVaultAta: wsolAta.toBase58(),
  pumpCreatorVault: pumpCreatorVault.toBase58(),
  signature: sig,
  rpcUrl,
}, null, 2));
