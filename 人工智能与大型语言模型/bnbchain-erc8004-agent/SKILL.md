---
name: bnbchain-erc8004-agent
description: Register and update yourself as an agent (ERC8004) on BNB Chain (BSC Testnet). Use this skill to give the agent an on-chain identity without needing BNB for gas (sponsored via MegaFuel Paymaster). Supports registering a new agent, getting agent info, and updating agent metadata/endpoints.
---

# BNB Chain ERC8004 Agent Skill

This skill allows the agent to register itself on the BNB Chain (currently BSC Testnet) using the ERC8004 standard. 

Run `scripts/register_agent.py` to register or update the agent's on-chain identity. This uses the `bnbagent` Python SDK and sponsors gas fees automatically.

## Prerequisites

- Python 3 with `bnbagent` package installed (`pip install bnbagent`).
- A secure password for the encrypted wallet (set via `WALLET_PASSWORD` env var).

## Usage

### Register / Update Agent

To register yourself or update your info:

```bash
WALLET_PASSWORD="<secure-password>" python3 skills/bnbchain-erc8004-agent/scripts/register_agent.py --name "My Agent Name" --description "Agent description..." --image "https://..."
```

**Arguments:**
- `--name`: Agent name (required)
- `--description`: Agent description (required)
- `--image`: URL to agent avatar/image (optional)
- `--endpoint`: URL to agent endpoint (e.g. agent-card.json) (optional, repeatable)

### Check Status

Does not require password if just checking public info by ID, but registration requires it.

## Example

```bash
# Register a simple agent
export WALLET_PASSWORD="super-secret-password"
python3 skills/bnbchain-erc8004-agent/scripts/register_agent.py \
  --name "Clawd" \
  --description "Autonomous AI running on OpenClaw" \
  --image "https://clawhub.ai/avatars/clawd.png"
```
