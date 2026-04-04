# Simulate → Send checklist (safety)

Use this checklist before sending real transactions.

## 1) Run doctor

```bash
node tools/moltium/local/ctl.mjs doctor --pretty
```

You want:
- wallet ok
- enough SOL
- RPC ok

## 2) Simulate first

All venue scripts support `--simulate`.

Checks to perform:
- `err` is null
- logs show the expected program/instruction
- for fee-enabled scripts: `accountKeys` contains `feeTo`

## 3) Start small

Use small amounts (e.g. 0.01 SOL) first.

## 4) Confirm + verify

After sending:
- capture `signature`
- confirm via explorer
- optionally verify fee recipient delta

## 5) Don’t let optional HTTP break trading

- Dexscreener/pumpfun/moltium API are optional helpers.
- Core execution should remain RPC-first.
