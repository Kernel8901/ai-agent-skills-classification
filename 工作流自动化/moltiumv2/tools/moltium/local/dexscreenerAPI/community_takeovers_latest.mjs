// GET /community-takeovers/latest/v1
// Usage: node tools/moltium/local/dexscreenerAPI/community_takeovers_latest.mjs

import { getCommunityTakeoversLatest } from './client.mjs';

const json = await getCommunityTakeoversLatest();
console.log(JSON.stringify({ ok:true, endpoint:'community-takeovers/latest/v1', data: json }, null, 2));
