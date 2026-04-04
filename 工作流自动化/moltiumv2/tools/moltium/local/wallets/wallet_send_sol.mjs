// Send SOL (SystemProgram transfer)
// Usage:
//   node tools/moltium/local/wallets/wallet_send_sol.mjs <toPubkey> <sol> [--simulate]

import bs58 from 'bs58';
import fs from 'node:fs';
import path from 'node:path';
import { Keypair, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { getConnection } from '../rpc/connection.mjs';

function loadDefaultKeypair(){
  const p = path.resolve(process.cwd(), '.secrets', 'moltium-wallet.json');
  const obj = JSON.parse(fs.readFileSync(p,'utf8'));
  return Keypair.fromSecretKey(bs58.decode(obj.secretKeyBase58));
}

async function main(){
  const argv = process.argv.slice(2);
  const simulateOnly = argv.includes('--simulate');
  const filtered = argv.filter(a => a !== '--simulate');
  const [toStr, solStr] = filtered;
  if(!toStr || !solStr){
    console.error('usage: wallet_send_sol.mjs <toPubkey> <sol> [--simulate]');
    process.exit(2);
  }

  const to = new PublicKey(toStr);
  const sol = Number(solStr);
  if(!Number.isFinite(sol) || sol <= 0) throw new Error('bad sol');
  const lamports = BigInt(Math.round(sol * 1e9));

  const payer = loadDefaultKeypair();
  const { conn, rpcUrl } = getConnection('confirmed');

  const ix = SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: to,
    lamports: Number(lamports),
  });

  const bh = await conn.getLatestBlockhash('confirmed');
  const msg = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: bh.blockhash,
    instructions: [ix],
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([payer]);

  if (simulateOnly) {
    const sim = await conn.simulateTransaction(tx, { replaceRecentBlockhash: true, sigVerify: false, commitment: 'confirmed' });
    console.log(JSON.stringify({ ok:true, action:'send_sol_simulate', to: to.toBase58(), sol, lamports: lamports.toString(), err: sim.value.err || null, logs: sim.value.logs || [], rpcUrl }, null, 2));
    return;
  }

  const sig = await conn.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
  const conf = await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
  if (conf.value.err) throw new Error(`confirm err: ${JSON.stringify(conf.value.err)}`);
  console.log(JSON.stringify({ ok:true, action:'send_sol', to: to.toBase58(), sol, lamports: lamports.toString(), signature: sig, rpcUrl }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
