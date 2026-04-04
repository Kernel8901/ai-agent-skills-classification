// Get pump.fun bonding curve creator + complete flag from a mint (RPC-only)
// Usage:
//   node tools/moltium/local/token_tools/pumpfun_creator_from_mint.mjs <mint>

import { PublicKey } from '@solana/web3.js';
import { getConnection } from '../rpc/connection.mjs';

const mint = process.argv[2];
if (!mint) {
  console.error('usage: pumpfun_creator_from_mint.mjs <mint>');
  process.exit(2);
}

const PUMPFUN_PROGRAM = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
const { conn, rpcUrl } = getConnection('confirmed');

const [bondingCurve] = PublicKey.findProgramAddressSync(
  [Buffer.from('bonding-curve'), new PublicKey(mint).toBuffer()],
  PUMPFUN_PROGRAM
);

const info = await conn.getAccountInfo(bondingCurve, 'confirmed');
if (!info?.data) {
  console.log(JSON.stringify({ ok: false, rpcUrl, mint, bondingCurve: bondingCurve.toBase58(), error: 'bonding_curve_not_found' }, null, 2));
  process.exit(1);
}

const buf = Buffer.from(info.data);
const complete = buf.readUInt8(48);
const creator = new PublicKey(buf.subarray(49, 81)).toBase58();

console.log(JSON.stringify({ ok: true, rpcUrl, mint, bondingCurve: bondingCurve.toBase58(), complete, creator }, null, 2));
