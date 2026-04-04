import fs from 'node:fs';
import path from 'node:path';
import { Keypair } from '@solana/web3.js';

export function loadOrCreateKeypair(filePath) {
  const p = path.resolve(filePath);
  if (fs.existsSync(p)) {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!Array.isArray(raw)) throw new Error(`Invalid keypair file (expected number[]): ${p}`);
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const kp = Keypair.generate();
  fs.writeFileSync(p, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}
