# Local token tools (on-chain only)

These tools use only Solana RPC + on-chain state.
- No HTTP fetch for metadata URIs.
- Prices are derived from on-chain programs (bonding/pumpswap).

## Commands

Mint info (decimals/supply/authorities):
```bash
node tools/moltium/local/token_tools/mint_info.mjs <mint>
```

Metaplex metadata (on-chain only):
```bash
node tools/moltium/local/token_tools/metadata_read.mjs <mint>
```

SOL price (best-effort):
```bash
node tools/moltium/local/token_tools/price_sol.mjs <mint>
```

PumpSwap: claim creator fees ("claim fee"):
```bash
# Claim is creator-wide; no mint required.
node tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs [<anyBaseMintForSanityCheck>] [--simulate] [--cu-limit N] [--cu-price microLamports]
```
