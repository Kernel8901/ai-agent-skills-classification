// List locally stored wallets (no secrets printed)
// Usage: node tools/moltium/local/wallets/wallet_list.mjs

import path from 'node:path';
import { listWalletFiles, readJson } from './wallet_store.mjs';

async function main(){
  const files = listWalletFiles();
  const wallets = [];
  for (const f of files) {
    try {
      const j = readJson(f);
      wallets.push({
        name: j.name || path.basename(f, '.json'),
        publicKey: j.publicKey || null,
        path: f,
        createdAt: j.createdAt || null,
      });
    } catch {
      wallets.push({ name: path.basename(f, '.json'), publicKey: null, path: f, error: 'invalid json' });
    }
  }
  console.log(JSON.stringify({ ok:true, count: wallets.length, wallets }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
