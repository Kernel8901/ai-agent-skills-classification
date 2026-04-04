# pump.fun token deploy (create + optional initial buy)

Before sending real transactions, follow:
- `references/simulate_checklist.md`

This toolkit can deploy a new pump.fun token using **RPC-built transactions** and (optionally) do an **initial buy**.

## What you get

On success, the deploy script returns JSON containing (at minimum):
- `signature` (deploy tx)
- `mint` (new token mint)
- `bondingCurve` and `associatedBondingCurve`
- `metadata` (Metaplex metadata PDA)
- `metadataUri`
- if initial buy enabled:
  - `buySignature`
  - `initialBuy` quote details

Module:
- `tools/moltium/local/tokendeploy/pumpfun/deploy.mjs`

## Prerequisites

1) Wallet funded
- `.secrets/moltium-wallet.json` exists
- wallet has enough SOL for:
  - pump.fun create/deploy costs
  - optional initial buy
  - network fees + rent for ATA creation

Check:
```bash
node tools/moltium/local/wallets/wallet_balance_sol.mjs
```

2) RPC configured (recommended)
- `.secrets/rpc/config.json` + provider URLs

See:
- `references/rpc.md`

## Logo + metadata

### Seeded logo generator (deterministic)

Generates a 512x512 PNG without external font dependencies.

```bash
node tools/moltium/local/tokendeploy/pumpfun/make_logo_seeded.mjs <out.png> <seed>
```

Example:
```bash
node tools/moltium/local/tokendeploy/pumpfun/make_logo_seeded.mjs \
  tools/moltium/local/tokendeploy/pumpfun/tmp/logo_seeded.png \
  "my-seed-123"
```

### Metadata URI

`deploy.mjs` supports:
- **Provide `uri`** (you host the JSON yourself), or
- **Provide `logoPath` (and optionally `description`)** and let the script upload metadata+image via pump.fun IPFS helper.

## Deploy API (module)

The exported function is:

- `deployPumpfunToken(params)`

Important params:
- `name` (required)
- `symbol` (required)
- `uri` (optional) — if omitted, the script auto-uploads
- `description` (optional)
- `logoPath` (required if `uri` is omitted)

Compute budget (deploy tx):
- `computeUnitLimit` (optional)
- `computeUnitPriceMicroLamports` (optional)

Initial buy (optional):
- `initialBuySol` (number)
- `slippageBps` (default in code is 100; **recommend 500** for stability)
- `trackVolume` (default true)
- `buyComputeUnitLimit`, `buyComputeUnitPriceMicroLamports`

## Recommended wrapper script

Because deploy has many params, it’s easiest to run a small wrapper so you don’t rely on envs.

Example wrapper (adapt):

```js
import { deployPumpfunToken } from '../tools/moltium/local/tokendeploy/pumpfun/deploy.mjs';

const res = await deployPumpfunToken({
  name: 'MyToken',
  symbol: 'MTK',
  description: 'hello',
  logoPath: 'tools/moltium/local/tokendeploy/pumpfun/tmp/logo.png',

  computeUnitLimit: 300000,
  computeUnitPriceMicroLamports: 666666,

  initialBuySol: 0.1,
  slippageBps: 500,
  buyComputeUnitLimit: 250000,
  buyComputeUnitPriceMicroLamports: 666666,
});

console.log(JSON.stringify(res, null, 2));
```

## Initial buy notes (important)

- The initial buy uses a **max cost** derived from `slippageBps`.
- If slippage is too tight you may see pump.fun errors like `TooMuchSolRequired`.
  In practice we found **500 bps** works reliably for small initial buys.

## Common failure modes

### 1) Not enough SOL / rent errors
Fix: fund the wallet with more SOL.

### 2) RPC flakiness (blockhash expired)
Fix:
- configure multiple RPCs and priority
- retry

### 3) Metadata URI becomes "undefined"
This was fixed in our local code previously (ensure create ix uses the final URI).
If you see `uri: "undefined"` on-chain, upgrade your local code.

## Security

- Never commit keypairs or API keys.
- Prefer a dedicated hot wallet for experiments.
