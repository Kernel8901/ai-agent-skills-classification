# RiskOfficer Skill for OpenClaw

Manage your investment portfolios, calculate risk metrics (VaR, Monte Carlo, Stress Tests), and optimize allocations using Risk Parity or Calmar Ratio — all through natural language chat.

## Features

- **Portfolio Management** — View, create, and edit portfolios
- **Risk Calculations** — VaR (free), Monte Carlo, Stress Tests
- **Portfolio Optimization** — Risk Parity, Calmar Ratio
- **Broker Integration** — Sync from Tinkoff/T-Bank
- **Multi-currency** — RUB/USD with automatic conversion

## Installation

### 1. Get your API Token

1. Open RiskOfficer app on iOS
2. Go to Settings → API Keys
3. Create new token for "OpenClaw"
4. Copy the token (starts with `ro_pat_...`)

### 2. Install the Skill

**Option A: Install via ClawHub (easiest)**  
Skill is in the [OpenClaw catalog](https://clawhub.ai/mib424242/riskofficer). If you have [ClawHub CLI](https://docs.openclaw.ai/tools/clawhub) installed:

```bash
clawhub install riskofficer
```

**Option B: Clone to workspace**
```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/mib424242/riskofficer-openclaw-skill riskofficer
```

**Option C: Clone to managed skills (shared)**
```bash
cd ~/.openclaw/skills
git clone https://github.com/mib424242/riskofficer-openclaw-skill riskofficer
```

### 3. Configure the Token

Add to `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "riskofficer": {
        "enabled": true,
        "apiKey": "ro_pat_your_token_here"
      }
    }
  }
}
```

Or set environment variable:
```bash
export RISK_OFFICER_TOKEN="ro_pat_your_token_here"
```

## Usage Examples

```
"Show my portfolios"
"Покажи мои риски"
"Calculate VaR for my main portfolio"
"Run stress test with COVID scenario"
"Optimize my portfolio using Risk Parity"
"Optimize my portfolio using Calmar Ratio"
"Add 50 shares of SBER to my portfolio"
```

## Subscription

All features are **currently FREE** for all users:
- VaR calculation
- Monte Carlo Simulation
- Stress Testing
- Portfolio Optimization

> Quant subscription is enabled and free during the beta period.

## Links

- 📂 **ClawHub (catalog):** [clawhub.ai/mib424242/riskofficer](https://clawhub.ai/mib424242/riskofficer) — install with `clawhub install riskofficer`
- 🔧 **GitHub:** [riskofficer-openclaw-skill](https://github.com/mib424242/riskofficer-openclaw-skill)
- 📱 **RiskOfficer app:** [App Store](https://apps.apple.com/ru/app/riskofficer/id6757360596)

## Support

- Website: https://riskofficer.tech
- Forum: https://forum.riskofficer.tech
- Email: support@riskofficer.tech

## License

MIT

---

**Synced from riskofficer backend v1.14.0**
