// Creator fees total
// Usage:
//   node tools/moltium/local/pumpfunAPI/creator_fees_total.mjs <devWalletAddress>
// or:
//   node tools/moltium/local/pumpfunAPI/creator_fees_total.mjs --mint <mint>

import { getCreatorFeesTotal, getCoin } from './client.mjs';

const argv = process.argv.slice(2);
if (!argv.length) { console.error('usage: creator_fees_total.mjs <devWalletAddress> OR --mint <mint>'); process.exit(2); }

let devWalletAddress = null;
if (argv[0] === '--mint') {
  const mint = argv[1];
  if (!mint) throw new Error('missing mint');
  const d = await getCoin(mint);
  const creator = d?.creator;
  if (!creator) throw new Error('failed to resolve creator');
  devWalletAddress = creator;
} else {
  devWalletAddress = argv[0];
}

const data = await getCreatorFeesTotal(devWalletAddress);
console.log(JSON.stringify({ ok:true, endpoint:'swap-api:/v1/creators/{devWalletAddress}/fees/total', devWalletAddress, data }, null, 2));
