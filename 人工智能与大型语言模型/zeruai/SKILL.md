---
name: zeruai
description: Register agents on the Zeru ERC-8004 Identity Registry, manage wallets and metadata, and read on-chain state. Use when an agent needs to register on-chain, check fees, read agent info, set metadata, or manage agent wallets on Base Sepolia.
user-invocable: true
metadata: {"openclaw":{"requires":{"env":["PRIVATE_KEY"],"bins":["node","npx"]},"primaryEnv":"PRIVATE_KEY"}}
---

# Zeru ERC-8004 Identity Registry

Register and manage AI agents on the Zeru Identity Registry (Base Sepolia). Costs 0.001 ETH per registration.

## One-Time Setup

Run once to install dependencies:

```bash
cd {baseDir} && npm install
```

## Commands

### `/zeruai register --name <name> --description <desc> --endpoint <url>`

Register a new agent on-chain. Pays 0.001 ETH fee. Creates hosted agent URI, mints NFT, and updates URI with real agentId.

```
/zeruai register --name "Trading Bot" --description "AI-powered trading agent" --endpoint "https://mybot.com/api"
/zeruai register --name "Data Analyzer" --description "Analyzes datasets" --endpoint "https://analyzer.ai/api" --image "https://example.com/icon.png"
```

Requires `PRIVATE_KEY` env var. Wallet must have ~0.002 ETH (0.001 fee + gas).

To run: `npx tsx {baseDir}/scripts/zeru.ts register --name "..." --description "..." --endpoint "..."`

### `/zeruai read <agentId>`

Read an agent's on-chain data: owner, URI, wallet, name, services.

```
/zeruai read 16
```

To run: `npx tsx {baseDir}/scripts/zeru.ts read 16`

### `/zeruai fee`

Check current registration fee and whether registration is open.

```
/zeruai fee
```

To run: `npx tsx {baseDir}/scripts/zeru.ts fee`

### `/zeruai set-metadata <agentId> --key <key> --value <value>`

Set custom metadata on an agent. Only the owner can call.

```
/zeruai set-metadata 16 --key "category" --value "trading"
```

Requires `PRIVATE_KEY`.

To run: `npx tsx {baseDir}/scripts/zeru.ts set-metadata 16 --key "category" --value "trading"`

### `/zeruai unset-wallet <agentId>`

Clear the agent wallet. Only the owner can call.

```
/zeruai unset-wallet 16
```

Requires `PRIVATE_KEY`.

To run: `npx tsx {baseDir}/scripts/zeru.ts unset-wallet 16`

## Setup

### Read-Only (no setup needed)

`read` and `fee` work without a private key.

### With Wallet (for registration and writes)

Add to your OpenClaw config (`~/.openclaw/openclaw.json`):

```json
{
  "skills": {
    "entries": {
      "zeruai": {
        "enabled": true,
        "env": {
          "PRIVATE_KEY": "0xYourFundedPrivateKey"
        }
      }
    }
  }
}
```

Optional env: `RPC_URL` to override default RPC (default: https://sepolia.base.org).

## Contract Info

- **Network:** Base Sepolia (chainId 84532)
- **Identity Registry:** `0xF0682549516A4BA09803cCa55140AfBC4e5ed2E0`
- **Registration Fee:** 0.001 ETH
- **Source:** `zeru`

## How It Works

1. **register** creates a hosted JSON document (ERC-8004 registration-v1 schema) via the Agent URI API, mints an NFT on the Identity Registry (paying the fee), then updates the document with the real agentId.
2. **read** queries the on-chain contract for owner, tokenURI, and agentWallet, then fetches and parses the URI JSON.
3. **fee** reads the current `registrationFee()` and `registrationEnabled()` from the contract.
4. **set-metadata** calls `setMetadata(agentId, key, value)` on the contract.
5. **unset-wallet** calls `unsetAgentWallet(agentId)` on the contract.
