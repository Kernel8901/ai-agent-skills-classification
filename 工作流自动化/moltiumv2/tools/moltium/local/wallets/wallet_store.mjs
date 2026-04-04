import fs from 'node:fs';
import path from 'node:path';

const WS = process.cwd();
export const SECRETS_DIR = path.resolve(WS, '.secrets');
export const WALLETS_DIR = path.resolve(SECRETS_DIR, 'wallets');
export const DEFAULT_WALLET_PATH = path.resolve(SECRETS_DIR, 'moltium-wallet.json');

export function ensureDirs() {
  if (!fs.existsSync(SECRETS_DIR)) fs.mkdirSync(SECRETS_DIR, { recursive: true });
  if (!fs.existsSync(WALLETS_DIR)) fs.mkdirSync(WALLETS_DIR, { recursive: true });
}

export function walletPath(name) {
  if (!name) throw new Error('wallet name required');
  // simple sanitize
  const safe = String(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.resolve(WALLETS_DIR, `${safe}.json`);
}

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

export function listWalletFiles() {
  ensureDirs();
  const arr = fs.readdirSync(WALLETS_DIR).filter(f => f.endsWith('.json'));
  return arr.map(f => path.resolve(WALLETS_DIR, f));
}
