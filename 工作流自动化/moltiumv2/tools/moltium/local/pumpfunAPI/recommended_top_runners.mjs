// Pump.fun top runners (best-effort)
// Usage: node tools/moltium/local/pumpfunAPI/recommended_top_runners.mjs [limit=10] [offset=0] [includeNsfw=false]

import { listCoins } from './client.mjs';

const [limitArg, offsetArg, includeNsfwArg] = process.argv.slice(2);
const limit = limitArg ? Number(limitArg) : 10;
const offset = offsetArg ? Number(offsetArg) : 0;
const includeNsfw = includeNsfwArg ? (includeNsfwArg === 'true') : false;

const data = await listCoins({ limit, offset, sort: 'volume_24h', order: 'DESC', includeNsfw });
console.log(JSON.stringify({ ok:true, endpoint:'frontend-api-v3:/coins', kind:'top-runners', limit, offset, includeNsfw, data }, null, 2));
