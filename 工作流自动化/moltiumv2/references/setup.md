# Setup (Windows / macOS / Linux)

This toolkit runs locally with Node.js and uses Solana RPC.

## Requirements

- Node.js 20+ (22+ recommended)
- npm
- Git (optional)

Verify Node:
```bash
node -v
npm -v
```

## Install dependencies

From workspace root:
```bash
npm install
```

## Secrets (do NOT commit)

Create (or reuse):
- `<workspace>/.secrets/`

Minimum:
- `.secrets/moltium-wallet.json`

Recommended:
- `.secrets/rpc/config.json` + `.secrets/rpc/*.txt`

Optional:
- `.secrets/moltium-api-key.txt` (Moltium API production)

Templates:
- `.secrets/rpc/*.template`

## Sanity checks

Wallet pubkey:
```bash
node tools/moltium/local/wallets/wallet_pubkey.mjs
```

SOL balance:
```bash
node tools/moltium/local/wallets/wallet_balance_sol.mjs
```

## OS notes

### Windows

- Use PowerShell or cmd.
- Always run commands from the workspace root.

### macOS / Linux

- Use bash/zsh.
- Run from the workspace root so `.secrets/` paths resolve.
- If you see permission issues, ensure the repo directory is writable.

## First safe test

Run a venue script with `--simulate` first (no tx sent):
```bash
node tools/moltium/local/pumpswap/local_buy.mjs <baseMint> 0.01 10 --simulate
```
