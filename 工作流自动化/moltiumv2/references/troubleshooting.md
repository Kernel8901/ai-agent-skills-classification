# Troubleshooting (MoltiumV2)

This page collects common issues across venues.

## 1) RPC / network

### Symptoms
- `block height exceeded`
- `blockhash not found`
- intermittent send/confirm failures

Fixes
- configure multi-RPC failover (`references/rpc.md`)
- retry with fresh blockhash (some scripts already refresh)

## 2) InsufficientFundsForRent / ATA creation

Symptoms
- `InsufficientFundsForRent`

Fixes
- fund wallet with more SOL
- remember ATAs may be created for:
  - base token
  - WSOL

## 3) Fee recipient cannot receive SOL

Symptoms
- fee transfer fails or simulation errors around SystemProgram.transfer

Cause
- fee recipient pubkey may not exist on-chain yet

Fix
- fund fee recipient once with a tiny SOL amount

## 4) Fee not showing up

Checks
- run with `--simulate` and ensure `accountKeys` includes `feeTo`
- confirm tx and compute lamport delta for `feeTo`

## 5) PumpSwap pool not found

Cause
- token has no PumpSwap pool (yet)

Fix
- use bonding curve scripts instead

## 6) PumpSwap claim fee succeeds but no SOL change

Cause
- nothing claimable

Fix
- treat as ok; optionally pre-check creator vault WSOL balance

## 7) pump.fun initial buy slippage failures

Symptoms
- pump.fun errors like `TooMuchSolRequired`

Fix
- raise `slippageBps` (commonly 500)

## 8) Tooling hygiene

- Don’t commit `.secrets/`
- Keep debug scripts out of the public skill
