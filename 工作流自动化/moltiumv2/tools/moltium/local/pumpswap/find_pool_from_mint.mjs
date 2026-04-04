// Find PumpSwap pool for a base mint (RPC-only)
// Usage:
//   node tools/moltium/local/pumpswap/find_pool_from_mint.mjs <baseMint>

import { findPoolForMints } from './resolve.mjs';
import { WSOL_MINT } from './constants2.mjs';

const baseMint = process.argv[2];
if (!baseMint) {
  console.error('usage: find_pool_from_mint.mjs <baseMint>');
  process.exit(2);
}

const r = await findPoolForMints({ baseMint, quoteMint: WSOL_MINT });
console.log(JSON.stringify({ ok: true, baseMint, quoteMint: WSOL_MINT, pool: r.pool, rpcUrl: r.rpcUrl }, null, 2));
