// Dexscreener: search endpoint
// Usage:
//   node tools/moltium/local/dexscreenerAPI/search.mjs <query>

import { searchPairs } from './client.mjs';

async function main(){
  const q = process.argv.slice(2).join(' ');
  if (!q) {
    console.error('usage: search.mjs <query>');
    process.exit(2);
  }
  const json = await searchPairs(q);
  console.log(JSON.stringify({ ok:true, endpoint:'search', query: q, data: json }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
