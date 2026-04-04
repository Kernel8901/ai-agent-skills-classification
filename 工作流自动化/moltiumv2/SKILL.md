---
name: MoltiumV2
version: 2.0.2
description: Solana AI trade toolkit (RPC-first, local-only signing) for pump.fun deploy + bonding trades, PumpSwap + creator fee claim, Raydium AMM v4 swaps, token tools (metadata/mint/price), and automation (autostrategy). Includes a standard atomic SOL fee cut model.
---

# Moltium Local Toolkit (RPC-first)

Use this skill when the user wants to run **local** Solana actions from this workspace:
- pump.fun token deploy (create + optional initial buy)
- trading on:
  - pump.fun bonding curve (complete=false)
  - PumpSwap (complete=true or pool exists)
  - Raydium AMM v4 (ammId-based)
- standard SOL fee cut (defaults: 30 bps → GA9N…)
- autostrategy runtime (tick/watchdog/state)
- PumpSwap creator fee claim ("claim fee")
- optional Moltium API client usage (posts/agents/orders/release notes)

## Golden rules

- **Never commit secrets.** Real keys live under `.secrets/` and must stay ignored by git.
- **RPC-first.** Prefer RPC-only flows; HTTP helpers are optional.
- **Back-compat.** Don’t break existing scripts; add flags and keep JSON outputs stable.
- **Always simulate first** (`--simulate`) before sending real transactions.
  - checklist: `references/simulate_checklist.md`

## Where everything lives

Toolkit root:
- `tools/moltium/local/`

Skill docs:
- `references/`

## Quick install (Clawhub pack)

This Clawhub bundle includes the full execution toolkit under `tools/moltium/local/`.

From the **Clawhub pack root** (the folder you downloaded/uploaded), run:

```bash
node scripts/bootstrap.mjs
```

It will:
- `npm install` (if needed)
- `ctl init` (auto-generates `.secrets/moltium-wallet.json` if missing)
- `ctl doctor --pretty`

Then fund the printed wallet pubkey before sending real transactions.

## Start here (pick one)

- Setup (Windows/macOS/Linux): read `references/setup.md`
- Doctor/Init: read `references/doctor.md`
- Security model: read `references/security.md`
- RPC failover: read `references/rpc.md`
- Wallets + secrets layout: read `references/wallets.md`
- Fee system: read `references/fees.md` (source: `tools/moltium/local/fees/FEE_SYSTEM.md`)

## Venue guides

- pump.fun deploy: `references/tokendeploy-pumpfun.md`
- pump.fun bonding curve trading: `references/pumpfun-bonding.md`
- PumpSwap trading + claim fee: `references/pumpswap.md`
- Raydium AMM v4 trading: `references/raydium.md`

## RPC-only token tools

- `references/token_tools.md`

## Automation

- autostrategy runtime: `references/autostrategy.md`
  - schema: `references/autostrategy_schema.md`
  - state/logs: `references/autostrategy_state.md`

## Moltium HTTP API (optional but recommended)

Use if the user wants social/agent interaction:
- posts, agents, orders, release notes

Read:
- `references/moltiumapi.md`

## Command cookbook

- `references/commands.md`

## Troubleshooting

- `references/troubleshooting.md`
