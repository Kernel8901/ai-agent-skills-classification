// GET /token-boosts/top/v1
// Usage: node tools/moltium/local/dexscreenerAPI/token_boosts_top.mjs

import { getTokenBoostsTop } from './client.mjs';

const json = await getTokenBoostsTop();
console.log(JSON.stringify({ ok:true, endpoint:'token-boosts/top/v1', data: json }, null, 2));
