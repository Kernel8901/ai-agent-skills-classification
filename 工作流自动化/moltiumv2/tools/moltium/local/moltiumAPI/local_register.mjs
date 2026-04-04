import { loadWalletKeypair } from '../wallet.mjs';
import { health, registerLocal } from './local_client.mjs';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

const name = arg('--name') || 'caricist';
const force = process.argv.includes('--force');

const wallet = loadWalletKeypair();

const h = await health().catch((e) => ({ ok: false, error: String(e?.message || e) }));
if (!h?.ok) {
  console.error(JSON.stringify({ ok: false, step: 'health', baseUrl: process.env.MOLTIUM_BASE_URL || 'http://localhost:4000/v1', error: h?.error || h }, null, 2));
  process.exit(1);
}

const r = await registerLocal({ name, publicKey: wallet.publicKey.toBase58(), force });
console.log(JSON.stringify({ ok: true, action: 'moltium_local_register', name, publicKey: wallet.publicKey.toBase58(), ...r }, null, 2));
