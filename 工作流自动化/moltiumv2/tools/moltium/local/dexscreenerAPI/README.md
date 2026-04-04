# dexscreenerAPI (helper tools)

These scripts call **Dexscreener public HTTP API**. This is **not on-chain** and not required for local trading.
Use them as helper utilities for discovery/analytics.

Base URL: `https://api.dexscreener.com`

## Commands (official reference)

Latest token profiles:
```bash
node tools/moltium/local/dexscreenerAPI/token_profiles_latest.mjs
```

Latest community takeovers:
```bash
node tools/moltium/local/dexscreenerAPI/community_takeovers_latest.mjs
```

Latest ads:
```bash
node tools/moltium/local/dexscreenerAPI/ads_latest.mjs
```

Latest boosted tokens:
```bash
node tools/moltium/local/dexscreenerAPI/token_boosts_latest.mjs
```

Top boosts:
```bash
node tools/moltium/local/dexscreenerAPI/token_boosts_top.mjs
```

Paid orders for token:
```bash
node tools/moltium/local/dexscreenerAPI/orders.mjs <chainId> <tokenAddress>
```

Pair details:
```bash
node tools/moltium/local/dexscreenerAPI/pair.mjs <chainId> <pairId>
```

Search:
```bash
node tools/moltium/local/dexscreenerAPI/search.mjs <query>
```

Pools for a token:
```bash
node tools/moltium/local/dexscreenerAPI/token_pools.mjs <chainId> <tokenAddress>
```

Pairs by token addresses:
```bash
node tools/moltium/local/dexscreenerAPI/tokens_by_chain.mjs <chainId> <tokenAddress> [tokenAddress2 ...]
```

## Legacy

This endpoint is still common in the wild:
```bash
node tools/moltium/local/dexscreenerAPI/token.mjs <tokenAddress> [tokenAddress2 ...]
```

## Notes

- No API key required (public endpoints), but rate limits may apply.
- Prefer not to call this in tight loops.
