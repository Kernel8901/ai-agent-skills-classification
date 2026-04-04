# PumpSwap trading + creator fee claim

Before sending real transactions, follow:
- `references/simulate_checklist.md`

PumpSwap is the venue used for pump.fun tokens once they are tradable on the PumpSwap AMM.

Toolkit folders:
- Trading: `tools/moltium/local/pumpswap/`
- Claim tool: `tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs`

## Trading scripts

- BUY: `tools/moltium/local/pumpswap/local_buy.mjs`
- SELL-ALL: `tools/moltium/local/pumpswap/local_sell_all.mjs`

Both are backendless (RPC-only) and do deterministic account resolution.

## Resolver (how accounts are found)

`pumpswap/resolve.mjs` does:
- find pool via `getProgramAccounts` memcmp filters on pool state:
  - baseMint offset 43
  - quoteMint offset 75 (WSOL)
- parse pool state to get pool vault token accounts
- read PumpSwap global config + select protocol fee recipient by pool index
- read pump.fun bonding curve account to get the mint creator
- derive PumpSwap creator vault authority PDA + its WSOL ATA

## Fee model (standard)

- BUY: **deduct + atomic**
  - fee deducted from gross SOL input
  - swap uses net
  - fee transfer is last ix in the same tx

- SELL: **minOut-based conservative + atomic**
  - fee computed from `minOutLamports` (slippage-applied)
  - fee transfer is last ix in the same tx

Override:
- `--fee-to <pubkey>`
- `--fee-bps 30`

## BUY: local_buy.mjs

Usage:
```bash
node tools/moltium/local/pumpswap/local_buy.mjs <baseMint> <solAmount> [slippagePct=10] \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--simulate]
```

Example:
```bash
node tools/moltium/local/pumpswap/local_buy.mjs <mint> 0.01 10 --simulate
node tools/moltium/local/pumpswap/local_buy.mjs <mint> 0.01 10
```

Output fields (common):
- `signature`
- `solAmountGross`, `solAmountNet`
- `feeLamports`, `feeTo`, `feeBps`
- `minOutTokens` (slippage-applied)

## SELL ALL: local_sell_all.mjs

Usage:
```bash
node tools/moltium/local/pumpswap/local_sell_all.mjs <baseMint> [slippagePct=10] \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--simulate]
```

No-balance behavior:
- returns `ok:true` and `signature:null` with a note.

Output fields (common):
- `signature`
- `minOutLamports`
- `feeLamports`, `feeTo`, `feeBps`

## Creator fee claim ("claim fee")

What it is:
- A dev wallet can withdraw accumulated creator fees via a PumpSwap instruction:
  - `TransferCreatorFeesToPump`

In this toolkit, claim is **creator-wide** (not mint-specific).

Script:
- `tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs`

Usage:
```bash
# simulate
node tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs --simulate

# real
node tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs
```

Optional sanity-check:
- pass any mint as the first arg; the script verifies this wallet is that mint’s creator.

Notes:
- It is possible for the tx to succeed but yield no SOL change if nothing is claimable.
- The script currently does not pre-check claimable amount; you can add a precheck by reading the creator vault WSOL ATA balance.

## Common errors

- `resolve failed: pool not found`
  - token may not have a PumpSwap pool

- `Token-2022` base mints
  - resolver detects token program; ATA derivation is token-program aware.
