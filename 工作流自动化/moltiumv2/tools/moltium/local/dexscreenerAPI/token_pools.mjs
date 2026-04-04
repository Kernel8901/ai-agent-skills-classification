// GET /token-pairs/v1/{chainId}/{tokenAddress}
// Usage: node tools/moltium/local/dexscreenerAPI/token_pools.mjs <chainId> <tokenAddress>

import { getTokenPools } from './client.mjs';

const [chainId, tokenAddress] = process.argv.slice(2);
if (!chainId || !tokenAddress) {
  console.error('usage: token_pools.mjs <chainId> <tokenAddress>');
  process.exit(2);
}

const json = await getTokenPools(chainId, tokenAddress);
console.log(JSON.stringify({ ok:true, endpoint:'token-pairs/v1', chainId, tokenAddress, data: json }, null, 2));
