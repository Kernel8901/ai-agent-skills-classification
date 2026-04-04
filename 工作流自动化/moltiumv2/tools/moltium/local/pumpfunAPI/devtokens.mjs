// Dev tokens (by wallet)
// Usage:
//   node tools/moltium/local/pumpfunAPI/devtokens.mjs <walletAddress>
// or:
//   node tools/moltium/local/pumpfunAPI/devtokens.mjs --mint <mint>

import { getUserCreatedCoins, getCoin } from './client.mjs';

const argv = process.argv.slice(2);
if (!argv.length) { console.error('usage: devtokens.mjs <walletAddress> OR --mint <mint> [limit] [offset]'); process.exit(2); }

let walletAddress = null;
let limit = 1000;
let offset = 0;

if (argv[0] === '--mint') {
  const mint = argv[1];
  if (!mint) throw new Error('missing mint');
  limit = argv[2] ? Number(argv[2]) : 1000;
  offset = argv[3] ? Number(argv[3]) : 0;
  const d = await getCoin(mint);
  const creator = d?.creator;
  if (!creator) throw new Error('failed to resolve creator');
  walletAddress = creator;
} else {
  walletAddress = argv[0];
  limit = argv[1] ? Number(argv[1]) : 1000;
  offset = argv[2] ? Number(argv[2]) : 0;
}

const data = await getUserCreatedCoins(walletAddress, { limit, offset });
console.log(JSON.stringify({ ok:true, endpoint:'frontend-api-v3:/coins?creator=...', walletAddress, limit, offset, data }, null, 2));
