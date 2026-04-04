// Send SPL token (Tokenkeg or Token-2022, auto-detected)
// Usage:
//   node tools/moltium/local/wallets/wallet_send_token.mjs <mint> <toOwnerPubkey> <amountRaw> [--simulate]
//
// amountRaw is in smallest units (raw integer).

import bs58 from 'bs58';
import fs from 'node:fs';
import path from 'node:path';
import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { getConnection } from '../rpc/connection.mjs';

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

function loadDefaultKeypair(){
  const p = path.resolve(process.cwd(), '.secrets', 'moltium-wallet.json');
  const obj = JSON.parse(fs.readFileSync(p,'utf8'));
  return Keypair.fromSecretKey(bs58.decode(obj.secretKeyBase58));
}

async function detectTokenProgramForMint(conn, mint) {
  const info = await conn.getAccountInfo(new PublicKey(mint), 'confirmed');
  if (!info) throw new Error('mint not found');
  const owner = info.owner.toBase58();
  if (owner === TOKEN_PROGRAM) return TOKEN_PROGRAM;
  if (owner === TOKEN_2022_PROGRAM) return TOKEN_2022_PROGRAM;
  return owner;
}

async function fetchDecimals(conn, mint) {
  // Parsed mint is easiest.
  const acc = await conn.getParsedAccountInfo(new PublicKey(mint), 'confirmed');
  const parsed = acc?.value?.data;
  if (parsed && typeof parsed === 'object' && parsed.parsed?.info?.decimals != null) {
    return Number(parsed.parsed.info.decimals);
  }
  throw new Error('failed to fetch mint decimals');
}

async function main(){
  const argv = process.argv.slice(2);
  const simulateOnly = argv.includes('--simulate');
  const filtered = argv.filter(a => a !== '--simulate');
  const [mintStr, toOwnerStr, amountRawStr] = filtered;

  if(!mintStr || !toOwnerStr || !amountRawStr){
    console.error('usage: wallet_send_token.mjs <mint> <toOwnerPubkey> <amountRaw> [--simulate]');
    process.exit(2);
  }

  const amountRaw = BigInt(amountRawStr);
  if (amountRaw <= 0n) throw new Error('bad amountRaw');

  const payer = loadDefaultKeypair();
  const toOwner = new PublicKey(toOwnerStr);
  const { conn, rpcUrl } = getConnection('confirmed');

  const tokenProgramStr = await detectTokenProgramForMint(conn, mintStr);
  const tokenProgramId = new PublicKey(tokenProgramStr);
  const splProgramId = tokenProgramId.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  const decimals = await fetchDecimals(conn, mintStr);

  const fromAta = getAssociatedTokenAddressSync(new PublicKey(mintStr), payer.publicKey, false, splProgramId);
  const toAta = getAssociatedTokenAddressSync(new PublicKey(mintStr), toOwner, false, splProgramId);

  const ixs = [];
  ixs.push(createAssociatedTokenAccountIdempotentInstruction(
    payer.publicKey,
    toAta,
    toOwner,
    new PublicKey(mintStr),
    splProgramId
  ));

  ixs.push(createTransferCheckedInstruction(
    fromAta,
    new PublicKey(mintStr),
    toAta,
    payer.publicKey,
    amountRaw,
    decimals,
    [],
    splProgramId
  ));

  const bh = await conn.getLatestBlockhash('confirmed');
  const msg = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: bh.blockhash,
    instructions: ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([payer]);

  if (simulateOnly) {
    const sim = await conn.simulateTransaction(tx, { replaceRecentBlockhash: true, sigVerify: false, commitment: 'confirmed' });
    console.log(JSON.stringify({ ok:true, action:'send_token_simulate', mint: mintStr, toOwner: toOwner.toBase58(), fromAta: fromAta.toBase58(), toAta: toAta.toBase58(), amountRaw: amountRaw.toString(), decimals, tokenProgram: tokenProgramStr, err: sim.value.err || null, logs: sim.value.logs || [], rpcUrl }, null, 2));
    return;
  }

  const sig = await conn.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
  const conf = await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
  if (conf.value.err) throw new Error(`confirm err: ${JSON.stringify(conf.value.err)}`);
  console.log(JSON.stringify({ ok:true, action:'send_token', mint: mintStr, toOwner: toOwner.toBase58(), fromAta: fromAta.toBase58(), toAta: toAta.toBase58(), amountRaw: amountRaw.toString(), decimals, tokenProgram: tokenProgramStr, signature: sig, rpcUrl }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
