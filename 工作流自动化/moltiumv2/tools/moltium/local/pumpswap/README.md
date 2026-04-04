# PumpSwap (local mode)

Backendless PumpSwap trading via on-chain program calls.

- Program: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`
- Quote mint (default): WSOL

## Scripts

### Buy

```bash
node tools/moltium/local/pumpswap/local_buy.mjs <baseMint> <solAmount> [slippagePct=10] [--fee-to <pubkey>] [--fee-bps 30] [--simulate]
```

Fee model (BUY): **deduct**
- feeLamports = gross * feeBps
- net = gross - feeLamports (used as swap input)
- fee transfer happens **in the same tx**, as the last instruction

### Sell all

```bash
node tools/moltium/local/pumpswap/local_sell_all.mjs <baseMint> [slippagePct=10] [--fee-to <pubkey>] [--fee-bps 30] [--simulate]
```

Fee model (SELL): **conservative minOut-based**
- feeLamports = minOutLamports * feeBps
- fee transfer happens **in the same tx**, as the last instruction

Notes:
- If there is no token balance, sell-all returns `ok:true` with `signature:null`.

## Resolution strategy

Deterministic (RPC-only):
- pool discovery by memcmp filters + parse pool state
- `global_config` PDA + parse GlobalConfig for fee bps + recipients
- PDAs: `event_authority`, volume accumulators
- coin creator: read from pump.fun bonding curve account, then derive `creator_vault` PDA and its WSOL ATA
- fee config: derived under `pfee` program (seeded by the known constant)

No PumpPortal, no Moltium backend.

## Notes

- Token-2022 base mints are supported; token program is detected from mint owner.
- Use `--simulate` to verify account resolution / instruction correctness without sending.
