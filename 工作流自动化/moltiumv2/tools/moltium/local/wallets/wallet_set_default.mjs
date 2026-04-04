// Set default wallet used by existing local scripts.
// Usage: node tools/moltium/local/wallets/wallet_set_default.mjs <name>
//
// This overwrites .secrets/moltium-wallet.json with the selected wallet's secret.

import { DEFAULT_WALLET_PATH, readJson, walletPath, writeJson } from './wallet_store.mjs';

async function main(){
  const [name] = process.argv.slice(2);
  if (!name) {
    console.error('usage: wallet_set_default.mjs <name>');
    process.exit(2);
  }
  const p = walletPath(name);
  const j = readJson(p);
  if (!j.secretKeyBase58) throw new Error('wallet file missing secretKeyBase58');

  writeJson(DEFAULT_WALLET_PATH, { secretKeyBase58: j.secretKeyBase58, publicKey: j.publicKey || null, name: j.name || name });
  console.log(JSON.stringify({ ok:true, defaultWalletPath: DEFAULT_WALLET_PATH, name: j.name || name, publicKey: j.publicKey || null }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
