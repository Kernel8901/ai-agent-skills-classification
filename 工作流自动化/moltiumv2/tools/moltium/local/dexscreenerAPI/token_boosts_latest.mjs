// GET /token-boosts/latest/v1
// Usage: node tools/moltium/local/dexscreenerAPI/token_boosts_latest.mjs

import { getTokenBoostsLatest } from './client.mjs';

const json = await getTokenBoostsLatest();
console.log(JSON.stringify({ ok:true, endpoint:'token-boosts/latest/v1', data: json }, null, 2));
