# Security model (local toolkit)

## What is local?

- Trades are executed by scripts in your environment.
- Private keys never leave your machine.

## Secrets

Never commit:
- `.secrets/moltium-wallet.json`
- `.secrets/wallets/*.json`
- `.secrets/rpc/*.txt` (API keys)
- `.secrets/moltium-api-key*.txt`

## Safe operating practices

- Start with `--simulate` before real tx.
- Use small test amounts first.
- Keep a dedicated hot wallet for experimentation.
- Expect MEV and adverse execution in thin liquidity.

## External HTTP

Optional components:
- `dexscreenerAPI/` (discovery)
- `pumpfunAPI/` (coin metadata)
- `moltiumAPI/` (social/agents/orders)

Disable/avoid these if you want strict RPC-only operation.
