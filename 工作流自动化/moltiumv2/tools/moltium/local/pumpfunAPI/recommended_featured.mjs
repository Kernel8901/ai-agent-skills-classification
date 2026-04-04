// Pump.fun recommended/featured tokens (best-effort)
// Usage: node tools/moltium/local/pumpfunAPI/recommended_featured.mjs [limit=10] [offset=0] [includeNsfw=false]

import { listCoins } from './client.mjs';

const [limitArg, offsetArg, includeNsfwArg] = process.argv.slice(2);
const limit = limitArg ? Number(limitArg) : 10;
const offset = offsetArg ? Number(offsetArg) : 0;
const includeNsfw = includeNsfwArg ? (includeNsfwArg === 'true') : false;

const data = await listCoins({ limit, offset, sort: 'featured', order: 'DESC', includeNsfw });
console.log(JSON.stringify({ ok:true, endpoint:'frontend-api-v3:/coins', kind:'featured', limit, offset, includeNsfw, data }, null, 2));
