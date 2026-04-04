// Show wallet public key
// Usage: node tools/moltium/local/wallets/wallet_show.mjs <name>

import { walletPath, readJson } from './wallet_store.mjs';

async function main(){
  const [name] = process.argv.slice(2);
  if (!name) {
    console.error('usage: wallet_show.mjs <name>');
    process.exit(2);
  }
  const p = walletPath(name);
  const j = readJson(p);
  console.log(JSON.stringify({ ok:true, name: j.name || name, publicKey: j.publicKey, path: p, createdAt: j.createdAt || null }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
