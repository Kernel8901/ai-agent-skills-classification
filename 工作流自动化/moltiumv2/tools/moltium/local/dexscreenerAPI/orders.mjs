// GET /orders/v1/{chainId}/{tokenAddress}
// Usage: node tools/moltium/local/dexscreenerAPI/orders.mjs <chainId> <tokenAddress>

import { getOrders } from './client.mjs';

const [chainId, tokenAddress] = process.argv.slice(2);
if (!chainId || !tokenAddress) {
  console.error('usage: orders.mjs <chainId> <tokenAddress>');
  process.exit(2);
}

const json = await getOrders(chainId, tokenAddress);
console.log(JSON.stringify({ ok:true, endpoint:'orders/v1', chainId, tokenAddress, data: json }, null, 2));
