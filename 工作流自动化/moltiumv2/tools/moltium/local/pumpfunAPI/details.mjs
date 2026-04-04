// Token details
// Usage: node tools/moltium/local/pumpfunAPI/details.mjs <mint>

import { getCoin } from './client.mjs';

const [mint] = process.argv.slice(2);
if (!mint) { console.error('usage: details.mjs <mint>'); process.exit(2); }

const data = await getCoin(mint);
console.log(JSON.stringify({ ok:true, endpoint:'frontend-api-v3:/coins/{mint}', mint, data }, null, 2));
