# token_tools (RPC-only helpers)

Before sending real transactions, follow:
- `references/simulate_checklist.md`

Folder:
- `tools/moltium/local/token_tools/`

These tools are designed to be small, deterministic, and safe:
- they read on-chain state
- they print a single JSON blob
- they do not require private key signing (except PumpSwap claim tool)

## 1) Mint info

Script:
- `mint_info.mjs`

Usage:
```bash
node tools/moltium/local/token_tools/mint_info.mjs <mint>
```

Output highlights:
- `tokenProgram` (`token` or `token-2022`)
- `supply`, `decimals`
- `mintAuthority`, `freezeAuthority`

## 2) Metaplex metadata (on-chain only)

Script:
- `metadata_read.mjs`

Usage:
```bash
node tools/moltium/local/token_tools/metadata_read.mjs <mint>
```

Notes:
- This does **not** fetch the `uri` from HTTP. It only reads the on-chain metadata account.

Output highlights:
- `metadataPda`
- `parsed.updateAuthority`
- `parsed.data.name/symbol/uri`

## 3) SOL price (best-effort, on-chain)

Script:
- `price_sol.mjs`

Usage:
```bash
node tools/moltium/local/token_tools/price_sol.mjs <mint>
```

How it works:
- if pump.fun bonding curve exists and `complete=false` → uses bonding curve quote
- else tries PumpSwap pool reserves

Output highlights:
- `source`: `bonding` or `pumpswap`
- bonding: `tokenOutFor1Sol`
- pumpswap: reserve-derived spot estimates

## 4) pump.fun creator from mint (RPC-only)

Script:
- `pumpfun_creator_from_mint.mjs`

Usage:
```bash
node tools/moltium/local/token_tools/pumpfun_creator_from_mint.mjs <mint>
```

Returns:
- `creator`
- `complete`
- `bondingCurve`

## 5) PumpSwap claim creator fees (signing)

Script:
- `pumpswap_claim_creator_fees.mjs`

Usage:
```bash
node tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs --simulate
node tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs
```

Notes:
- This sends a real tx (unless `--simulate`).
- It can succeed even if nothing is claimable.
