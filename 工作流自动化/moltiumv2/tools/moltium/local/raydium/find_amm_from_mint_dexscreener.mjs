// Find Raydium AMM v4 candidate ammIds for a mint via Dexscreener (HTTP helper)
// Usage:
//   node tools/moltium/local/raydium/find_amm_from_mint_dexscreener.mjs <mint>

import { getTokenPools } from '../dexscreenerAPI/client.mjs';

const mint = process.argv[2];
if (!mint) {
  console.error('usage: find_amm_from_mint_dexscreener.mjs <mint>');
  process.exit(2);
}

const pools = await getTokenPools('solana', mint);
const pairs = Array.isArray(pools?.pairs) ? pools.pairs : (Array.isArray(pools) ? pools : []);

// Raydium pairs on Dexscreener often put ammId in pairAddress.
const ray = pairs
  .filter(p => String(p?.dexId || '').toLowerCase().includes('raydium'))
  .map(p => ({
    pairAddress: p.pairAddress,
    dexId: p.dexId,
    url: p.url,
    quoteToken: p.quoteToken,
    baseToken: p.baseToken,
    liquidityUsd: p.liquidity?.usd ?? null,
    volumeH24: p.volume?.h24 ?? null,
  }))
  .filter(x => x.pairAddress);

console.log(JSON.stringify({ ok: true, mint, candidates: ray }, null, 2));
