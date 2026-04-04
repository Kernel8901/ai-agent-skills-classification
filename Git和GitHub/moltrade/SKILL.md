---
name: moltrade
description: Operate the Moltrade trading bot (config, backtest, test-mode runs, Nostr signal broadcast, exchange adapters, strategy integration) in OpenClaw.
metadata:
  openclaw:
    emoji: "🤖"
    requires:
      bins: ["python", "pip"]
    homepage: https://github.com/hetu-project/moltrade.git
---

# Moltrade Bot Skill

Paths are repo-root relative. Keep actions deterministic and redact secrets.

## Install & Init

- Clone the repo and install Python deps locally (code is required for strategies, nostr, and CLI):
  - `git clone https://github.com/hetu-project/moltrade.git`
  - `cd moltrade/trader && pip install -r requirements.txt`
- Initialize a fresh config with the built-in wizard (no trading):
  - `python main.py --init` (prompts for relayer URL, wallet, nostr, copy-trade follower defaults, and optional bot registration)
- For CI/agents, keep using the repo checkout; there is no separate pip package/CLI yet.

## Update Config Safely

- Backup or show planned diff before edits.
- Change only requested fields (e.g., `trading.exchange`, `trading.default_strategy`, `nostr.relays`).
- Validate JSON; keep types intact. Remind user to provide real secrets themselves.

## Run Backtest (local)

- Install deps: `pip install -r trader/requirements.txt`.
- Command: `python trader/backtest.py --config trader/config.example.json --strategy <name> --symbol <symbol> --interval 1h --limit 500`.
- Report PnL/win rate/trade count/drawdown if available. Use redacted config (no real keys).

## Start Bot (test mode)

- Ensure `config.json` exists (run `python main.py --init` if not) and `trading.exchange` set (default hyperliquid).
- Command: `python trader/main.py --config config.json --test --strategy <name> --symbol <symbol> --interval 300`.
- Watch `trading_bot.log`; never switch to live without explicit user approval.

## Run Bot (live)

- Only after validation on test mode; remove `--test` to hit mainnet.
- Command: `python trader/main.py --config config.json --strategy <name> --symbol <symbol>`.
- Double-check keys, risk limits, and symbol before starting; live mode will place real orders.

## Broadcast Signals to Nostr

- Check `nostr` block: `nsec`, `relayer_nostr_pubkey`, `relays`, `sid`.
- `SignalBroadcaster` is wired in `main.py`. In test mode, verify `send_trade_signal` / `send_execution_report` run without errors.

## Add Exchange Adapter

- Implement adapter in `trader/exchanges/` matching `HyperliquidClient` interface (`get_candles`, `get_balance`, `get_positions`, `place_order`, etc.).
- Register in `trader/exchanges/factory.py` keyed by `trading.exchange`.
- Update config `trading.exchange` and rerun backtest/test-mode.

## Integrate New Strategy

- Follow `trader/strategies/INTEGRATION.md` to subclass `BaseStrategy` and register in `get_strategy`.
- Add config under `strategies.<name>`; backtest, then test-mode before live.

## Safety / Secrets

- Never print or commit private keys, mnemonics, nsec, or shared keys.
- Default to test mode; require explicit consent for live trading.
