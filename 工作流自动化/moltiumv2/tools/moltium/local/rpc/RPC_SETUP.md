# RPC failover setup (local mode)

This project is designed to be **RPC-only** (no backend). You can configure multiple RPC endpoints for redundancy.

## Supported sources (in order)

1) Environment variables:
- `SOLANA_RPC` (single URL override)

2) New multi-RPC directory (recommended):
- `.secrets/rpc/config.json`
- `.secrets/rpc/<name>.txt` (one URL per file)

3) Legacy single-RPC files:
- `.secrets/solana-rpc-helius.txt`
- `.secrets/moltium-rpc.txt`

4) Fallback:
- `https://api.mainnet-beta.solana.com`

## Multi-RPC config

Create `.secrets/rpc/config.json` like (template also available at `.secrets/rpc/config.json.template`):

```json
{
  "default": "helius",
  "priority": ["helius", "quicknode", "alchemy", "public"],
  "allowPublicFallback": true
}
```

Then add URLs (you can start from the provided `*.txt.template` files in `.secrets/rpc/`):

- `.secrets/rpc/helius.txt`
- `.secrets/rpc/quicknode.txt`
- `.secrets/rpc/alchemy.txt`
- `.secrets/rpc/triton.txt`
- `.secrets/rpc/ankr.txt`
- `.secrets/rpc/public.txt` (optional)

## Notes

- Files are plain text with a single URL.
- Secrets (API keys) should never be committed or pasted in chat.
- The code can also do an **async healthcheck-based selection** via `getConnectionAuto()`.
