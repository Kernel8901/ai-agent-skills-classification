# RPC failover (multi-provider)

Config is read by:
- `tools/moltium/local/rpc/connection.mjs`

## Selection order

1) `SOLANA_RPC` env override (single URL)
2) `.secrets/rpc/config.json` + `.secrets/rpc/*.txt`
3) legacy `.secrets/solana-rpc-helius.txt` / `.secrets/moltium-rpc.txt`
4) fallback: `https://api.mainnet-beta.solana.com`

## Multi-RPC config

Templates are provided under:
- `.secrets/rpc/*.template`

Steps:

1) Copy the config template:
- `.secrets/rpc/config.json.template` → `.secrets/rpc/config.json`

2) Create provider URL files (one URL per file):
- `.secrets/rpc/helius.txt`
- `.secrets/rpc/quicknode.txt`
- `.secrets/rpc/alchemy.txt`
- `.secrets/rpc/triton.txt`
- `.secrets/rpc/ankr.txt`
- `.secrets/rpc/public.txt` (optional)

After running `ctl.mjs init`, these files will exist but contain placeholders.
Replace them with real URLs.

3) Put them in priority order in `config.json`.

## Healthcheck-based selection

Some modules/scripts use `getConnectionAuto()` which:
- iterates over candidates
- probes with a lightweight `getLatestBlockhash`
- picks the first healthy endpoint

If you see intermittent failures, prefer scripts that use `getConnectionAuto()`.

## Troubleshooting

- 429 / rate limits → add more providers; lower request rates.
- blockhash expired → retry; ensure commitment `processed` for blockhash fetch where appropriate.
- TLS/proxy issues → ensure providers are `https://`.
