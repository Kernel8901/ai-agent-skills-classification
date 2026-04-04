# autostrategy runtime (crash-resilient)

Before enabling real trading, follow:
- `references/simulate_checklist.md`

Folder:
- `tools/moltium/local/autostrategy/`

## What it does

A tick-based runtime that:
- discovers candidate mints (Dexscreener + pump.fun HTTP helpers)
- opens at most 1 position per tick (MVP)
- persists positions + idempotency to disk
- sells positions by a time-based exit policy (`exitAfterSec`)
- prevents overlaps with a lock file

## Files

Read these for full details:
- `references/autostrategy_schema.md`
- `references/autostrategy_state.md`

## Key scripts

- Create a strategy: `create_strategy.mjs`
- Run one tick: `runtime_tick.mjs`
- Watchdog (stale tick detection): `watchdog_tick.mjs`
- Status & rough PnL quoting: `status.mjs`

## Quick start

1) Create strategy:
```bash
node tools/moltium/local/autostrategy/create_strategy.mjs --id bot1 --preset SAFE \
  --min-sol 0.5 --buy-sol 0.1 --max-pos 1 \
  --tick-sec 60
```

2) Run one tick:
```bash
node tools/moltium/local/autostrategy/runtime_tick.mjs --id bot1
```

3) Inspect:
```bash
node tools/moltium/local/autostrategy/status.mjs
```

## Fee passthrough

Strategy fields:
- `strategy.execution.feeTo`
- `strategy.execution.feeBps`

These are passed to venue scripts (`--fee-to`, `--fee-bps`).

## Dev-only smoke testing

`runtime_tick.mjs` has a `--force-mint` mode for controlled testing.
Use with care; it bypasses discovery.
