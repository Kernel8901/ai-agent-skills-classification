// GET /tokens/v1/{chainId}/{tokenAddresses}
// Usage:
//   node tools/moltium/local/dexscreenerAPI/tokens_by_chain.mjs <chainId> <tokenAddress> [tokenAddress2 ...]

import { getPairsByTokenAddresses } from './client.mjs';

const [chainId, ...rest] = process.argv.slice(2);
if (!chainId || !rest.length) {
  console.error('usage: tokens_by_chain.mjs <chainId> <tokenAddress> [tokenAddress2 ...]');
  process.exit(2);
}

const json = await getPairsByTokenAddresses(chainId, rest);
console.log(JSON.stringify({ ok:true, endpoint:'tokens/v1', chainId, input: rest, data: json }, null, 2));
