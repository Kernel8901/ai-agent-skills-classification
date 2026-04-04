# Moltium local fee system (SOL)

This folder provides a shared, backendless fee helper for **SOL-based fees**.

## Defaults

- Default fee recipient (override via CLI or env):
  - `GA9N683FPXx6vFgpZxkFsMwH4RE8okZcGo6g5F5SzZjx`
- Default fee rate:
  - `30 bps` = `0.30%`

Implementation: `sol_fee.mjs`

## How fees are applied

### BUY (preferred): deduct + atomic

- `feeLamports = grossLamports * feeBps / 10000`
- `netLamports = grossLamports - feeLamports`
- Swap uses `netLamports` as input.
- Fee transfer is appended as the **last instruction in the same tx**.

This keeps the fee payment atomic (trade + fee succeed/fail together).

### SELL (safe): conservative minOut-based + atomic

On sells, the exact SOL out is not known pre-trade.
For atomic correctness without relying on post-confirm parsing, we compute:

- `feeLamports = minOutLamports * feeBps / 10000`

This is conservative (fee <= actual proceeds in normal cases).
Fee transfer is appended as the **last instruction in the same tx**.

## Overrides

Supported by updated scripts:

- `pumpfun_bonding/local_buy_curve.mjs`
- `pumpfun_bonding/local_sell_curve_all.mjs`
- `pumpswap/local_buy.mjs`
- `pumpswap/local_sell_all.mjs`
- `raydium/local_buy.mjs`
- `raydium/local_sell_all.mjs`

Common flags:

- `--fee-to <pubkey>`
- `--fee-bps <number>`

Environment variables:

- `MOLTIUM_FEE_TO`
- `MOLTIUM_FEE_BPS`

## Gotchas

- The fee recipient pubkey must exist on-chain as a System account to receive SOL via `SystemProgram.transfer`.
  If it's a never-used pubkey, fund it once with a tiny SOL amount to initialize it.
