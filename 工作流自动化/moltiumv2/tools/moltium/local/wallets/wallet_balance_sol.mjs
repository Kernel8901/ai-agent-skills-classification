// Get SOL balance for a wallet
// Usage:
//   node tools/moltium/local/wallets/wallet_balance_sol.mjs [pubkey]
// If omitted, uses default wallet.

import bs58 from 'bs58';
import fs from 'node:fs';
import path from 'node:path';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getConnection } from '../rpc/connection.mjs';

function loadDefaultPubkey(){
  const p = path.resolve(process.cwd(), '.secrets', 'moltium-wallet.json');
  const obj = JSON.parse(fs.readFileSync(p,'utf8'));
  const kp = Keypair.fromSecretKey(bs58.decode(obj.secretKeyBase58));
  return kp.publicKey;
}

async function main(){
  const [maybe] = process.argv.slice(2);
  const pubkey = maybe ? new PublicKey(maybe) : loadDefaultPubkey();
  const { conn, rpcUrl } = getConnection('confirmed');
  const lamports = await conn.getBalance(pubkey, 'confirmed');
  console.log(JSON.stringify({ ok:true, pubkey: pubkey.toBase58(), lamports, sol: lamports/1e9, rpcUrl }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
