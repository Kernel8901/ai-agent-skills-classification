import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM, TOKEN_2022_PROGRAM } from './constants.mjs';

function pk(s){ return new PublicKey(String(s)); }

export async function detectTokenProgramForMint(conn, mint) {
  const info = await conn.getAccountInfo(pk(mint), 'confirmed');
  if (!info) throw new Error('Mint account not found');
  const owner = info.owner.toBase58();
  if (owner === TOKEN_PROGRAM) return TOKEN_PROGRAM;
  if (owner === TOKEN_2022_PROGRAM) return TOKEN_2022_PROGRAM;
  // return owner anyway (future-proof)
  return owner;
}
