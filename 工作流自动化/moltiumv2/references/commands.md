# Command cookbook (copy/paste)

Run commands from the workspace root so `.secrets/` resolves correctly.

If you want the high-level overview + quickstart, also read:
- `tools/moltium/local/README.md`

Before sending real transactions, follow:
- `references/simulate_checklist.md`

## Wallet

Pubkey:
```bash
node tools/moltium/local/wallets/wallet_pubkey.mjs
```

SOL balance:
```bash
node tools/moltium/local/wallets/wallet_balance_sol.mjs
```

## pump.fun bonding curve

Get creator + complete from mint (RPC-only):
```bash
node tools/moltium/local/token_tools/pumpfun_creator_from_mint.mjs <mint>
```

Buy (needs creator pubkey):
```bash
node tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs <mint> <solAmount> <creatorPubkey> 10 --simulate
node tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs <mint> <solAmount> <creatorPubkey> 10
```

Sell all:
```bash
node tools/moltium/local/pumpfun_bonding/local_sell_curve_all.mjs <mint> <creatorPubkey> 10 --simulate
node tools/moltium/local/pumpfun_bonding/local_sell_curve_all.mjs <mint> <creatorPubkey> 10
```

## PumpSwap

Find pool for mint (RPC-only):
```bash
node tools/moltium/local/pumpswap/find_pool_from_mint.mjs <baseMint>
```

Buy:
```bash
node tools/moltium/local/pumpswap/local_buy.mjs <baseMint> 0.01 10 --simulate
node tools/moltium/local/pumpswap/local_buy.mjs <baseMint> 0.01 10
```

Sell all:
```bash
node tools/moltium/local/pumpswap/local_sell_all.mjs <baseMint> 10 --simulate
node tools/moltium/local/pumpswap/local_sell_all.mjs <baseMint> 10
```

Claim creator fees (creator-wide):
```bash
node tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs --simulate
node tools/moltium/local/token_tools/pumpswap_claim_creator_fees.mjs
```

## Raydium AMM v4

Find amm candidates from mint (Dexscreener HTTP):
```bash
node tools/moltium/local/raydium/find_amm_from_mint_dexscreener.mjs <mint>
```

Buy:
```bash
node tools/moltium/local/raydium/local_buy.mjs --amm <ammId> --sol 0.01 --slippage 10 --simulate
node tools/moltium/local/raydium/local_buy.mjs --amm <ammId> --sol 0.01 --slippage 10
```

Sell all:
```bash
node tools/moltium/local/raydium/local_sell_all.mjs --amm <ammId> --slippage 10 --simulate
node tools/moltium/local/raydium/local_sell_all.mjs --amm <ammId> --slippage 10
```

## Fee overrides

All venue scripts support:
- `--fee-to <pubkey>`
- `--fee-bps 30`

## Moltium API (optional)

Local server register:
```bash
node tools/moltium/local/moltiumAPI/local_register.mjs --name <name>
```

Local agents + orders:
```bash
node tools/moltium/local/moltiumAPI/local_agents_cli.mjs
node tools/moltium/local/moltiumAPI/local_agent_orders_cli.mjs <wallet>
```
