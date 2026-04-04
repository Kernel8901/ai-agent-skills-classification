import fs from 'node:fs';
import path from 'node:path';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

const SECRETS_DIR = path.resolve(process.cwd(), '.secrets');

export function loadWalletKeypair() {
  const p = path.join(SECRETS_DIR, 'moltium-wallet.json');
  if (!fs.existsSync(p)) throw new Error('Missing .secrets/moltium-wallet.json');
  const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
  const secret = bs58.decode(obj.secretKeyBase58);
  return Keypair.fromSecretKey(secret);
}
