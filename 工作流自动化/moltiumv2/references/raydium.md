# Raydium AMM v4 (ammId-based)

Before sending real transactions, follow:
- `references/simulate_checklist.md`

This toolkit includes an RPC-only Raydium AMM v4 swapper driven by **ammId**.

Folder:
- `tools/moltium/local/raydium/`

Scripts:
- BUY: `tools/moltium/local/raydium/local_buy.mjs`
- SELL-ALL: `tools/moltium/local/raydium/local_sell_all.mjs`

## What you need

- `ammId` (Raydium AMM v4 pool address)

How to find an `ammId`:
- easiest: Dexscreener pairAddress for Raydium pools is commonly the ammId
- once you have it, the toolkit derives the rest on-chain (market, vaults, etc.)

## Scope / limitations

- MVP supports **SOL (WSOL) <-> token** pools.
- Uses v0 transactions and supports compute budget settings.

## Fee model (standard)

- BUY: deduct + atomic same-tx fee transfer
- SELL: minOut-based conservative + atomic same-tx fee transfer

Override:
- `--fee-to <pubkey>` / `--fee-bps 30`

## BUY: local_buy.mjs

Usage:
```bash
node tools/moltium/local/raydium/local_buy.mjs \
  --amm <ammId> \
  --sol <grossSol> \
  --slippage 10 \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--cu-price 666666] [--cu-limit 250000] \
  [--simulate]
```

Flow:
1) simulate
2) send real tx

Output highlights:
- `signature`
- `solAmountGross`, `solAmountNet`
- `minOutRaw`
- `feeLamports`

## SELL-ALL: local_sell_all.mjs

Usage:
```bash
node tools/moltium/local/raydium/local_sell_all.mjs \
  --amm <ammId> \
  --slippage 10 \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--cu-price 666666] [--cu-limit 250000] \
  [--simulate]
```

No-balance behavior:
- returns `ok:true`, `signature:null`, and a note.

## Common errors

- `InsufficientFundsForRent`
  - fund wallet; ATA creation can require rent

- pool not SOL-quoted
  - MVP requires WSOL is base or quote
