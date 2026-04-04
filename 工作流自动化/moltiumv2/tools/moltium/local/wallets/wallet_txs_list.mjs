// List recent transaction signatures for a wallet
// Usage: node tools/moltium/local/wallets/wallet_txs_list.mjs [pubkey] [limit=20]

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
  const [a0, a1] = process.argv.slice(2);
  // Allow calling as: wallet_txs_list.mjs 20  (limit only)
  // or: wallet_txs_list.mjs <pubkey> 20
  const isLimitOnly = a0 && /^[0-9]+$/.test(a0) && !a1;
  const owner = isLimitOnly ? loadDefaultPubkey() : (a0 ? new PublicKey(a0) : loadDefaultPubkey());
  const limitStr = isLimitOnly ? a0 : a1;
  const limit = limitStr ? Math.max(1, Math.min(1000, Number(limitStr))) : 20;
  const { conn, rpcUrl } = getConnection('confirmed');
  const sigs = await conn.getSignaturesForAddress(owner, { limit }, 'confirmed');
  console.log(JSON.stringify({ ok:true, owner: owner.toBase58(), limit, rpcUrl, signatures: sigs }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
