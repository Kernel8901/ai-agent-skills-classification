# Raydium (local)

RPC-only Raydium AMM **v4** swapping by **ammId** (no Moltium backend).

- AMM v4 program id: `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`
- Current MVP supports: SOL (WSOL) <-> token pools

## Scripts

### Buy (fixed-in)

```bash
node tools/moltium/local/raydium/local_buy.mjs \
  --amm <ammId> \
  --sol <grossSol> \
  --slippage 10 \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--cu-price 666666] [--cu-limit 250000] \
  [--simulate]
```

Fee model (BUY): **deduct + atomic**
- feeLamports = gross * feeBps
- net = gross - feeLamports (used as swap input)
- fee transfer is the **last instruction in the same tx**

### Sell all (fixed-in)

```bash
node tools/moltium/local/raydium/local_sell_all.mjs \
  --amm <ammId> \
  --slippage 10 \
  [--fee-to <pubkey>] [--fee-bps 30] \
  [--cu-price 666666] [--cu-limit 250000] \
  [--simulate]
```

Fee model (SELL): **conservative minOut-based + atomic**
- feeLamports = minOutLamports * feeBps
- fee transfer is the **last instruction in the same tx**

If there is no token balance, sell-all returns `ok:true` with `signature:null`.

## Internals

- `amm_v4/poolkeys_from_ammid.mjs`: derives pool keys by ammId (RPC-only)
- `amm_v4/quote_fixed_in.mjs`: quote helper
- `amm_v4/swap_fixed_in_ix.mjs`: instruction builder
- `amm_v4/tx_send.mjs`: v0 send + simulate helpers

## IDL

Reference IDL stored at:
- `tools/moltium/local/raydium/idl/raydium_amm_idl.json`

Source:
- https://github.com/chainstacklabs/pumpfun-bonkfun-bot/blob/main/idl/raydium_amm_idl.json
