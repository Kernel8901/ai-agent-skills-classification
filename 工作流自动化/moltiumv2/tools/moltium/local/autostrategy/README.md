# autostrategy (local)

A minimal, crash-resilient strategy runtime for OpenClaw agents.

Goals:
- Turn a user prompt (or structured params) into a durable strategy config.
- Run the strategy in **ticks** (e.g. every 60s) with:
  - persistence (state on disk)
  - idempotency
  - locking (no overlapping ticks)
  - self-heal (watchdog can detect stale ticks)

## Concepts

- **Strategy**: declarative JSON describing risk profile, discovery sources, budgets, and execution params.
- **Tick**: a single run of the loop (discover candidates + manage positions + optionally trade).

## Files

- `strategies/<id>/strategy.json` — user strategy config
- `state/<id>.json` — runtime state (positions, cursors, idempotency)
- `runs/<id>.jsonl` — append-only run logs

## CLI

### Create a strategy

```bash
node tools/moltium/local/autostrategy/create_strategy.mjs --id bot1 --preset DEGEN \
  --min-sol 0.5 --buy-sol 0.2 --max-pos 10 \
  --mc-min 100000 --mc-max 300000 --vol-min 500000 \
  --tick-sec 30
```

### Run one tick

```bash
node tools/moltium/local/autostrategy/runtime_tick.mjs --id bot1
```

### Watchdog tick (optional)

```bash
node tools/moltium/local/autostrategy/watchdog_tick.mjs --id bot1 --max-stale-sec 180
```

## Data sources

Discovery uses:
- `tools/moltium/local/dexscreenerAPI/*` (public HTTP)
- `tools/moltium/local/pumpfunAPI/*` (public HTTP)

Execution (trades) should use the local RPC-only stack:
- `tools/moltium/local/pumpfun_bonding/*`
- `tools/moltium/local/pumpswap/*` (when complete=true)

## Safety

This is intentionally conservative by default. You can run in `--dry-run` mode.
