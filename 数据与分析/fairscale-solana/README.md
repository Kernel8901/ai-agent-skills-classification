# FairScale Solana Skill

Check Solana wallet reputation scores before any transaction. Detect Sybils, assess creditworthiness, and analyze connected wallets.

## Features

- **FairScore (0-100)** — Overall wallet reputation
- **Risk Tiers** — Bronze/Silver/Gold/Diamond
- **Badges** — LST Staker, Diamond Hands, Veteran, etc.
- **Connected Wallet Analysis** — Check who the wallet transacts with
- **Sybil Detection** — Bot and fake account detection

## Install

### Option 1: ClawHub (Recommended)

```bash
npx clawhub@latest install fairscale-solana
```

### Option 2: GitHub

```bash
npx skills add RisheeA/fairscale-solana-skill
```

### Option 3: Manual

```bash
git clone https://github.com/RisheeA/fairscale-solana-skill.git
cp -r fairscale-solana-skill ~/.openclaw/skills/
```

## Setup

1. Get your API key at https://sales.fairscale.xyz

2. Configure the key:

```bash
# OpenClaw
openclaw config set skills.entries.fairscale-solana.env.FAIRSCALE_API_KEY "your_key"

# Or set as environment variable
export FAIRSCALE_API_KEY="your_key"
```

3. Restart your agent

## Usage

Ask your agent:

- "Check wallet `5G5HDvbib4CyHxVgm4RHiVY5RfbDuFfp6BiH5xgZXczT`"
- "Is this wallet trustworthy?"
- "Should I trade with this address?"
- "Who does this wallet interact with?"

## Example Response

```
📊 FairScore: 43/100 | Tier: Silver

⚡ MODERATE — Standard precautions

🏅 Badges: LST Staker, Diamond Hands, Veteran, Active Trader

📈 Stats: 75 txns | 81 active days | 97% platform diversity

💡 Improve: Increase LST Holdings

🔗 Connected Wallets:
• 4mtV...txot — 62 (Silver) — https://orb.helius.dev/address/4mtV...
• 8u7v...ua3E — 78 (Gold) — https://orb.helius.dev/address/8u7v...
• 9xKz...ab2F — 15 (Bronze) — https://orb.helius.dev/address/9xKz...

Network: 🟡 Mixed
```

## File Structure

```
fairscale-solana-skill/
├── SKILL.md          # Main skill instructions
├── README.md         # This file
├── LICENSE           # MIT
├── scripts/
│   └── check_wallet.sh   # Sample bash script
└── references/
    └── API.md        # Full API documentation
```

## Links

- **Get API Key:** https://sales.fairscale.xyz
- **API Docs:** https://api2.fairscale.xyz/docs
- **Twitter:** [@FairScaleXYZ](https://twitter.com/FairScaleXYZ)
- **Website:** https://fairscale.xyz

## License

MIT
