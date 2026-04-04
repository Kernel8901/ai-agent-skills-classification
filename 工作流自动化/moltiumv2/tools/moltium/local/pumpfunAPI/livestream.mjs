// Livestream info
// Usage: node tools/moltium/local/pumpfunAPI/livestream.mjs <mint>
// Uses mintId param.

import { getLivestream } from './client.mjs';

const [mint] = process.argv.slice(2);
if (!mint) { console.error('usage: livestream.mjs <mint>'); process.exit(2); }

try {
  const data = await getLivestream(mint);
  console.log(JSON.stringify({ ok:true, endpoint:'livestream-api:/livestream?mintId=...', mintId: mint, data }, null, 2));
} catch (e) {
  // Treat 404 as "not live"
  if (String(e?.message||e).includes('HTTP 404')) {
    console.log(JSON.stringify({ ok:true, endpoint:'livestream-api:/livestream?mintId=...', mintId: mint, live:false, data: null }, null, 2));
    process.exit(0);
  }
  throw e;
}
