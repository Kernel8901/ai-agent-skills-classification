# pumpfunAPI (helper tools)

These scripts call **pump.fun public/semipublic HTTP endpoints directly** (external HTTP).

Upstreams:
- `https://frontend-api-v3.pump.fun`
- `https://swap-api.pump.fun`
- `https://livestream-api.pump.fun`

(They are not guaranteed stable; parse defensively.)

## Endpoints

Latest tokens:
```bash
node tools/moltium/local/pumpfunAPI/recommended_latest.mjs [limit] [offset] [includeNsfw]
```

Featured/recommended tokens (best-effort, depends on pump.fun support):
```bash
node tools/moltium/local/pumpfunAPI/recommended_featured.mjs [limit] [offset] [includeNsfw]
```

Top runners (best-effort):
```bash
node tools/moltium/local/pumpfunAPI/recommended_top_runners.mjs [limit] [offset] [includeNsfw]
```

Token details:
```bash
node tools/moltium/local/pumpfunAPI/details.mjs <mint>
```

Recent trades:
```bash
node tools/moltium/local/pumpfunAPI/trades.mjs <mint> [limit] [cursor] [minSolAmount]
```

Candles (OHLCV):
```bash
node tools/moltium/local/pumpfunAPI/candles.mjs <mint> [interval=1m] [limit=500] [createdTs]
```

Dev tokens:
```bash
node tools/moltium/local/pumpfunAPI/devtokens.mjs <walletAddress> [limit] [offset]
node tools/moltium/local/pumpfunAPI/devtokens.mjs --mint <mint> [limit] [offset]
```

Livestream info:
```bash
node tools/moltium/local/pumpfunAPI/livestream.mjs <mint>
```

Creator fees total:
```bash
node tools/moltium/local/pumpfunAPI/creator_fees_total.mjs <devWalletAddress>
node tools/moltium/local/pumpfunAPI/creator_fees_total.mjs --mint <mint>
```
