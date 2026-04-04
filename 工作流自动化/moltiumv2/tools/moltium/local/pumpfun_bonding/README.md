# pump.fun bonding curve (local mode)

Backendless bonding-curve trading via on-chain pump.fun program calls.

- Program: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`

## Scripts

### Buy (curve)

```bash
node tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs <mint> <solAmount> <creatorPubkey> [slippagePct=10] \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--cu-limit N] [--cu-price microLamports] \
  [--simulate]
```

Fee model (BUY): **deduct + atomic**
- feeLamports = gross * feeBps
- net = gross - feeLamports (used as curve buy input)
- fee transfer is the **last instruction in the same tx**

### Sell all (curve)

```bash
node tools/moltium/local/pumpfun_bonding/local_sell_curve_all.mjs <mint> <creatorPubkey> [slippagePct=10] \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--cu-limit N] [--cu-price microLamports] \
  [--simulate]
```

Fee model (SELL): **conservative minOut-based + atomic**
- feeLamports = minSolOutLamports * feeBps
- fee transfer is the **last instruction in the same tx**

## Notes

- Only valid for `complete=false`. If `complete=true`, use PumpSwap.
- Token program (Token / Token-2022) is detected from mint owner.
