// GET /ads/latest/v1
// Usage: node tools/moltium/local/dexscreenerAPI/ads_latest.mjs

import { getAdsLatest } from './client.mjs';

const json = await getAdsLatest();
console.log(JSON.stringify({ ok:true, endpoint:'ads/latest/v1', data: json }, null, 2));
