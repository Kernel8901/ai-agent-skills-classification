# MoltiumV2 — local Solana toolkit (RPC-first)

This folder is the **canonical execution engine** for MoltiumV2.
It is designed to run locally against Solana RPC (no PumpPortal required).

If you are using OpenClaw Skill docs, start here:
- `skills/MoltiumV2/SKILL.md`

## Golden rules

- Always try `--simulate` first.
- Keep `.secrets/` private (never commit it).
- Prefer multi-RPC configuration for reliability.

## Quickstart

```bash
# 1) Create templates
node tools/moltium/local/ctl.mjs init

# 2) Put your funded wallet keypair here (JSON array)
#    .secrets/moltium-wallet.json

# 3) (Recommended) Fill RPC URLs:
#    .secrets/rpc/*.txt  (replace REPLACE_ME)

# 4) Verify setup
node tools/moltium/local/ctl.mjs doctor --pretty
```

## What’s inside

- `ctl.mjs`
  - `init`: creates template files under `.secrets/`
  - `doctor`: environment + wallet + RPC checks

- `rpc/`
  - RPC selection + failover (`connection.mjs`)

- `wallet.mjs`
  - loads `.secrets/moltium-wallet.json` (non-custodial)

- Venue modules:
  - `tokendeploy/pumpfun/` — deploy pump.fun token (create + optional initial buy)
  - `pumpfun_bonding/` — bonding curve buy/sell (complete=false)
  - `pumpswap/` — PumpSwap buy/sell + creator fee claim
  - `raydium/` — Raydium AMM v4 buy/sell

- `fees/`
  - shared SOL fee helper (default 0.30%)

- `token_tools/`
  - RPC-only utilities (metadata read, mint info, pumpfun creator resolution, etc.)

- `autostrategy/`
  - crash-resilient tick runtime that routes execution by venue

- `moltiumAPI/` (optional)
  - HTTP client for Moltium social/agents/orders/release notes (must not be required for trading)

## Fees (default)

- Fee recipient: `GA9N683FPXx6vFgpZxkFsMwH4RE8okZcGo6g5F5SzZjx`
- Fee bps: `30` (= 0.30%)

Details:
- `tools/moltium/local/fees/FEE_SYSTEM.md`

## Security note (npm audit)

`npm audit` may report **high** severity advisories in the dependency chain (currently via `bigint-buffer` used by Solana/Raydium layout utilities).

- There are **no known critical advisories** in the current dependency set.
- If `npm audit` shows `fixAvailable: false`, the fix must come from upstream packages.

Recommendation:
- Prefer reputable RPC providers.
- Keep dependencies updated.

## Common entrypoints (CLI)

- Pump.fun deploy:
  - `node tools/moltium/local/tokendeploy/pumpfun/deploy.mjs ...`

- Bonding curve:
  - `node tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs ...`
  - `node tools/moltium/local/pumpfun_bonding/local_sell_curve_all.mjs ...`

- PumpSwap:
  - `node tools/moltium/local/pumpswap/local_buy.mjs ...`
  - `node tools/moltium/local/pumpswap/local_sell_all.mjs ...`
  - `node tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs --creator <pubkey> ...`

- Raydium:
  - `node tools/moltium/local/raydium/local_buy.mjs ...`
  - `node tools/moltium/local/raydium/local_sell_all.mjs ...`

- Autostrategy:
  - `node tools/moltium/local/autostrategy/runtime_tick.mjs --strategy <path> --simulate`

For full commands and examples:
- `references/commands.md`
