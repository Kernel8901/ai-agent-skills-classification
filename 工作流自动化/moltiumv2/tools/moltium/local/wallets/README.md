# Local wallet tools (RPC-only)

These scripts manage wallets and wallet queries without any backend.

## Wallet storage

- Default wallet used by existing local trade scripts: `.secrets/moltium-wallet.json`
- Additional wallets: `.secrets/wallets/<name>.json`

Wallet file format (A-style):

```json
{
  "name": "trader-1",
  "publicKey": "...",
  "secretKeyBase58": "...",
  "createdAt": "..."
}
```

## Commands

Create:
```bash
node tools/moltium/local/wallets/wallet_create.mjs <name> [--set-default]
```

List:
```bash
node tools/moltium/local/wallets/wallet_list.mjs
```

Show:
```bash
node tools/moltium/local/wallets/wallet_show.mjs <name>
```

Set default:
```bash
node tools/moltium/local/wallets/wallet_set_default.mjs <name>
```

Balances:
```bash
node tools/moltium/local/wallets/wallet_balance_sol.mjs [pubkey]
node tools/moltium/local/wallets/wallet_balance_tokens.mjs [pubkey] [--include-zero]
```

Transfers:
```bash
node tools/moltium/local/wallets/wallet_send_sol.mjs <toPubkey> <sol> [--simulate]
node tools/moltium/local/wallets/wallet_send_token.mjs <mint> <toOwnerPubkey> <amountRaw> [--simulate]
node tools/moltium/local/wallets/wallet_burn_token.mjs <mint> <amountRaw> [--simulate]
```

Transactions:
```bash
node tools/moltium/local/wallets/wallet_txs_list.mjs [pubkey] [limit]
node tools/moltium/local/wallets/wallet_tx_show.mjs <signature>
```
