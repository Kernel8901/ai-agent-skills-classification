# Wallets + secrets

Default wallet loader:
- `tools/moltium/local/wallet.mjs`

## Default wallet

Path:
- `.secrets/moltium-wallet.json`

Format:
- Solana keypair JSON array (standard)

## Safety

- Never paste or commit keypairs.
- Use a dedicated hot wallet for experimentation.

## Funding

Before trading/deploying:
- send SOL to the wallet pubkey
- confirm via:
```bash
node tools/moltium/local/wallets/wallet_balance_sol.mjs
```

## Named wallets (optional)

Folder:
- `.secrets/wallets/`

You can store additional keypairs there.
Not all scripts expose wallet selection yet; by default they use the default wallet.

## Common gotchas

- If your fee recipient is a never-used pubkey, fund it once so it exists as a System account.
- ATA creation costs rent; keep spare SOL.
