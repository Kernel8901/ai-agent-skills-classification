# autostrategy state + logs

Folder:
- `tools/moltium/local/autostrategy/`

## Files

Per strategy id:

- `state/<id>.json`
  - durable runtime state
- `runs/<id>.jsonl`
  - append-only tick outputs
- `events/<id>.jsonl`
  - append-only events (BUY/SELL/alerts)
- `state/<id>.lock`
  - lockfile preventing overlapping ticks

## State shape (high level)

`state/<id>.json` contains:

- `positions` (map mint -> object)
  - `mint`
  - `creator`
  - `openedAt`
  - `buySig`
  - `buySol`
  - `venue` (`bonding`|`pumpswap`)
  - `complete` boolean
- `idempotency` (map key -> object)
  - used to prevent duplicate buy/sell in the same minute
- `cooldowns` (map mint -> epochMs)
  - blocklist for re-buy after sell
- `cursors`
  - reserved for future paging state

## Locking

Ticks acquire `state/<id>.lock`.
If you see `lock busy`, a previous tick crashed without releasing.
It is safe to delete the lock **only if you are sure no tick is running**.

## Debug overrides

`runtime_tick.mjs` supports `--force-mint` and related flags for smoke tests.
Treat these as dev-only.
