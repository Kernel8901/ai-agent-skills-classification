// Create a new Solana keypair (local, non-custodial)
// Usage:
//   node tools/moltium/local/wallets/wallet_create.mjs <name> [--set-default]
//
// Stores under: .secrets/wallets/<name>.json
// Format: { name, publicKey, secretKeyBase58, createdAt }

import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { DEFAULT_WALLET_PATH, ensureDirs, walletPath, writeJson } from './wallet_store.mjs';

async function main(){
  const argv = process.argv.slice(2);
  const setDefault = argv.includes('--set-default');
  const filtered = argv.filter(a => a !== '--set-default');
  const [name] = filtered;
  if (!name) {
    console.error('usage: wallet_create.mjs <name> [--set-default]');
    process.exit(2);
  }

  ensureDirs();

  const kp = Keypair.generate();
  const obj = {
    name,
    publicKey: kp.publicKey.toBase58(),
    secretKeyBase58: bs58.encode(kp.secretKey),
    createdAt: new Date().toISOString(),
  };

  const p = walletPath(name);
  writeJson(p, obj);

  if (setDefault) {
    writeJson(DEFAULT_WALLET_PATH, { secretKeyBase58: obj.secretKeyBase58, publicKey: obj.publicKey, name });
  }

  console.log(JSON.stringify({ ok:true, name, path:p, publicKey: obj.publicKey, setDefault }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
