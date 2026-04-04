// GET /token-profiles/latest/v1
// Usage: node tools/moltium/local/dexscreenerAPI/token_profiles_latest.mjs

import { getTokenProfilesLatest } from './client.mjs';

const json = await getTokenProfilesLatest();
console.log(JSON.stringify({ ok:true, endpoint:'token-profiles/latest/v1', data: json }, null, 2));
