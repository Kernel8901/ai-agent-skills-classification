// Recent trades
// Usage: node tools/moltium/local/pumpfunAPI/trades.mjs <mint>

import { getTrades } from './client.mjs';

const [mint, limitArg, cursorArg, minSolAmountArg] = process.argv.slice(2);
if (!mint) { console.error('usage: trades.mjs <mint> [limit=100] [cursor=0] [minSolAmount=0.05]'); process.exit(2); }

const limit = limitArg ? Number(limitArg) : 100;
const cursor = cursorArg ? Number(cursorArg) : 0;
const minSolAmount = minSolAmountArg ? Number(minSolAmountArg) : 0.05;

const data = await getTrades(mint, { limit, cursor, minSolAmount });
console.log(JSON.stringify({ ok:true, endpoint:'swap-api:/v2/coins/{mint}/trades', mint, limit, cursor, minSolAmount, data }, null, 2));
