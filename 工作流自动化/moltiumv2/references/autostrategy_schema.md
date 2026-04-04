# autostrategy schema (strategy.json)

Location:
- `tools/moltium/local/autostrategy/strategies/<id>/strategy.json`

This is a practical guide (not a formal JSON schema). Fields marked **required** are needed for runtime.

## Top-level

- `id` (required): string
- `kind` (required): `"auto_trade"`
- `enabled`: boolean
- `tickSec`: number (seconds)
- `wallet`: string (currently `"default"`)

## budgets

- `minSolBalance`: number (SOL). Tick skips if wallet SOL below this.
- `buySolPerTrade`: number (SOL). Position size.
- `maxOpenPositions`: number
- `maxBuysPerHour`: number (not strictly enforced in MVP)
- `maxLossSolPerDay`: number (not strictly enforced in MVP)

## slippage

- `mode`: `"auto"` (MVP)
- `maxPct`: number. Used as upper bound for venue script slippage.

## fees (compute budget)

- `cuLimit`: number (default often 250k)
- `cuPrice`: number microLamports/CU (priority fee)

## discovery

- `usePumpfunNewCoins`: boolean (opt-in)
- `sources`: toggles for discovery feeds
  - `dexscreenerBoostsTop`
  - `dexscreenerBoostsLatest`
  - `dexscreenerAdsLatest`
  - `pumpfunTrending`
- `filters`:
  - `chainId`: should be `"solana"`
  - `marketCapMin` / `marketCapMax`
  - `volume24hMin`
  - `tokenAgeMinSec` / `tokenAgeMaxSec`

## execution

- `dryRun`: boolean. If true, no on-chain txs are sent.
- `slippageBps`: number (MVP currently uses fixed values in some places)
- `feeTo`: pubkey string. Passed to venue scripts (`--fee-to`).
- `feeBps`: number. Passed to venue scripts (`--fee-bps`).
- `exitAfterSec`: number | null. Time-based exit policy.
- `cooldownAfterSellSec`: number | null. Prevent immediate re-buys.

## Notes

- Venue routing:
  - if `coin.complete === true` → PumpSwap
  - else → pump.fun bonding curve
- State is persisted and idempotent; see `autostrategy_state.md`.
