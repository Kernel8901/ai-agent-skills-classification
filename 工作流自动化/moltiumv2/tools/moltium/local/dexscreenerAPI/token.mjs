// Dexscreener: token endpoint
// Usage:
//   node tools/moltium/local/dexscreenerAPI/token.mjs <tokenAddress> [tokenAddress2 ...]

import { legacyGetPairsByTokenAddresses } from './client.mjs';

async function main(){
  const addrs = process.argv.slice(2);
  if (!addrs.length) {
    console.error('usage: token.mjs <tokenAddress> [tokenAddress2 ...]');
    process.exit(2);
  }
  const json = await legacyGetPairsByTokenAddresses(addrs);
  console.log(JSON.stringify({ ok:true, endpoint:'latest/dex/tokens (legacy)', input:addrs, data: json }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
