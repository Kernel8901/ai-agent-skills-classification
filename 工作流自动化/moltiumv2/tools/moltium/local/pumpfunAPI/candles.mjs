// Candles (OHLCV)
// Usage:
//   node tools/moltium/local/pumpfunAPI/candles.mjs <mint> [interval=1m] [limit=500] [createdTs]
//
// If createdTs omitted, resolves via token details.

import { getCandles, getCoin } from './client.mjs';

const [mint, intervalArg, limitArg, createdTsArg] = process.argv.slice(2);
if (!mint) { console.error('usage: candles.mjs <mint> [interval=1m] [limit=500] [createdTs]'); process.exit(2); }

const interval = intervalArg || '1m';
const limit = limitArg ? Number(limitArg) : 500;
let createdTs = createdTsArg ? Number(createdTsArg) : null;

if (!createdTs) {
  const d = await getCoin(mint);
  const ts = d?.created_timestamp;
  if (!ts) throw new Error('failed to resolve created_timestamp for createdTs');
  createdTs = Number(ts);
}

const data = await getCandles(mint, { createdTs, interval, limit });
console.log(JSON.stringify({ ok:true, endpoint:'swap-api:/v2/coins/{mint}/candles', mint, interval, limit, createdTs, data }, null, 2));
