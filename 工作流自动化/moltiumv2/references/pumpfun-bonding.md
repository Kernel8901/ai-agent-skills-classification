# pump.fun bonding curve trading (complete=false)

Before sending real transactions, follow:
- `references/simulate_checklist.md`

Use these scripts to trade directly against pump.fun’s **bonding curve** when the coin is **not complete**.

Scripts:
- `tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs`
- `tools/moltium/local/pumpfun_bonding/local_sell_curve_all.mjs`

## When to use bonding vs PumpSwap

- If the bonding curve account field `complete = 0` → use bonding scripts
- If `complete = 1` → use PumpSwap scripts

Practical rule:
- If a PumpSwap pool exists you can often use PumpSwap regardless of complete.

## Inputs you need

### 1) Mint
- The pump.fun token mint (base58)

### 2) Creator pubkey
Bonding scripts require the **creator pubkey**.

Ways to obtain it:
1) From pump.fun / pumpfunAPI coin endpoint (if you allow HTTP)
2) From on-chain bonding curve account (RPC-only) — the toolkit can derive this.

RPC-only method (recommended):
- `node tools/moltium/local/token_tools/pumpfun_creator_from_mint.mjs <mint>`

This reads the on-chain bonding curve account and prints the resolved creator pubkey.

## Fee model (standard)

- BUY: **deduct + atomic**
  - fee is deducted from gross SOL input; swap uses net
  - fee transfer is the **last ix in the same tx**

- SELL: **minOut-based conservative + atomic**
  - fee is computed from `minSolOutLamports` (slippage-applied)
  - fee transfer is the **last ix in the same tx**

Defaults:
- `feeBps = 30`
- `feeTo = GA9N...`

Override flags:
- `--fee-to <pubkey>`
- `--fee-bps 30`

## BUY: local_buy_curve.mjs

Usage:
```bash
node tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs \
  <mint> <solAmount> <creatorPubkey> [slippagePct=10] \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--cu-limit N] [--cu-price microLamports] \
  [--simulate]
```

Suggested flow:
1) simulate
2) real tx with small amount

Example:
```bash
node tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs <mint> 0.01 <creator> 10 --simulate
node tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs <mint> 0.01 <creator> 10
```

## SELL ALL: local_sell_curve_all.mjs

Usage:
```bash
node tools/moltium/local/pumpfun_bonding/local_sell_curve_all.mjs \
  <mint> <creatorPubkey> [slippagePct=10] \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--cu-limit N] [--cu-price microLamports] \
  [--simulate]
```

No-balance behavior:
- If you have no token balance, it returns JSON:
  - `ok: true`
  - `signature: null`
  - `note: "No token balance to sell"`

## Common errors

- `Bonding curve complete; use pumpswap instead`
  - switch venue

- `InsufficientFundsForRent`
  - fund wallet (ATA creation + fees)

- Fee not transferred
  - simulate and ensure `accountKeys` includes `feeTo`

## JSON outputs

All scripts print a single JSON blob to stdout.
Treat it as the source of truth (signatures, minOut, feeLamports, etc.).
