// Dexscreener: pair endpoint
// Usage:
//   node tools/moltium/local/dexscreenerAPI/pair.mjs <chain> <pairAddress>

import { getPair } from './client.mjs';

async function main(){
  const [chain, pair] = process.argv.slice(2);
  if (!chain || !pair) {
    console.error('usage: pair.mjs <chain> <pairAddress>');
    process.exit(2);
  }
  const json = await getPair(chain, pair);
  console.log(JSON.stringify({ ok:true, endpoint:'pair', chain, pair, data: json }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
