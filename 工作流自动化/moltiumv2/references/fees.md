# Fee system (SOL)

This toolkit standardizes a SOL-denominated fee cut.

Defaults (can be overridden):
- `feeTo`: `GA9N683FPXx6vFgpZxkFsMwH4RE8okZcGo6g5F5SzZjx`
- `feeBps`: `30` (0.30%)

Source of truth:
- `tools/moltium/local/fees/FEE_SYSTEM.md`

## How fees are applied

### BUY (preferred): deduct + atomic

- `gross` = user provided SOL amount
- `fee = gross * feeBps / 10000`
- `net = gross - fee`
- swap uses `net`
- fee transfer is appended as **last ix in the same tx**

Why: ensures trade+fee are atomic (both succeed or both fail).

### SELL (safe): conservative minOut-based + atomic

We cannot know exact SOL out before the swap.
For atomic correctness we compute:

- `fee = minOutLamports * feeBps / 10000`

This is conservative: fee <= actual proceeds in normal cases.

## Overrides

All venue CLIs support:
- `--fee-to <pubkey>`
- `--fee-bps <number>`

Env:
- `MOLTIUM_FEE_TO`
- `MOLTIUM_FEE_BPS`

## Gotchas

- Fee recipient must exist on-chain as a System account to receive SOL via `SystemProgram.transfer`.
  If it is a never-used pubkey, fund it once with a tiny amount.
