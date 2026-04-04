---
name: receipts-guard
description: Capture and verify all agreements before your agent accepts them. Local risk analysis and evidence capture for autonomous transactions.
metadata: {"openclaw":{"emoji":"🧾","requires":{"anyBins":["node"]}}}
---

# RECEIPTS Guard

Protect your agent's autonomy by capturing evidence of every agreement it accepts. When your OpenClaw agent clicks "I agree" or makes a payment, RECEIPTS creates a local, immutable record.

**Problem solved:** When disputes happen, you have proof of exactly what was agreed to.

**No API. No cloud. Your data stays local.**

## Why You Need This

Your OpenClaw agent is:
- Accepting Terms of Service without you knowing the full terms
- Making purchases with binding agreements
- Signing up for services with hidden clauses

Every action creates liability. Zero creates evidence. Until now.

## Configuration

Configure in **`~/.openclaw/openclaw.json`**:

```json
"skills": {
  "entries": {
    "receipts-guard": {
      "enabled": true,
      "env": {
        "RECEIPTS_AGENT_ID": "my-openclaw-agent"
      }
    }
  }
}
```

| Variable | Description |
|----------|-------------|
| RECEIPTS_AGENT_ID | Unique identifier for this agent instance (optional) |

## Agent Instructions

### Before Accepting Any Terms of Service

1. **Extract the terms text** from the page before clicking any "I agree", "Accept", or "Continue" button
2. **Run the capture script** to analyze and store the agreement:
   ```bash
   node ~/.openclaw/workspace/skills/receipts-guard/capture.js "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"
   ```
3. **Check the response**:
   - If `recommendation: "proceed"` - Safe to accept
   - If `recommendation: "require_approval"` - Ask user before accepting
   - If `recommendation: "block"` - Do NOT accept, inform user of risk flags
4. **Store the receipt ID** for future reference

### Before Making Any Payment

1. **Capture the terms** associated with the purchase
2. **Include transaction details** when available:
   ```bash
   node ~/.openclaw/workspace/skills/receipts-guard/capture.js "CHECKOUT_TERMS" "https://merchant.com/checkout" "Merchant Name"
   ```
3. **Only proceed with payment** if capture succeeds and recommendation allows

### Security Rules

- **Never skip capture** for agreements or payments - this protects the user
- **Never ignore block recommendations** - these indicate serious risk flags
- **Always store receipt IDs** in transaction logs for future disputes

## Usage Examples

### Capture Terms of Service
```bash
node ~/.openclaw/workspace/skills/receipts-guard/capture.js \
  "By using this service you agree to binding arbitration..." \
  "https://example.com/terms" \
  "Example Corp"
```

### Response Format
```json
{
  "captureId": "local_6c6870d3e01cd265",
  "recommendation": "proceed",
  "trustScore": 72,
  "riskFlags": [],
  "summary": "Standard terms with 30-day refund policy",
  "documentHash": "6c6870d3e01cd265..."
}
```

### Risk Flag Response
```json
{
  "captureId": "local_abc123def456",
  "recommendation": "block",
  "trustScore": 40,
  "riskFlags": [
    "Binding arbitration clause",
    "Class action waiver",
    "No refund policy"
  ],
  "summary": "Terms contain multiple restrictive clauses"
}
```

## What Gets Captured

- Full document text (SHA-256 hashed for immutability)
- Source URL and timestamp
- Merchant/service name
- Risk analysis results
- Trust score

All data stays local on your machine. No external API calls.

## Risk Flags Detected

The local analyzer flags:
- Binding arbitration clauses
- Class action waivers
- Rights waivers
- No refund policies
- Auto-renewal clauses
- Data selling/sharing clauses
- Limited liability clauses
- Indemnification clauses

## Links

- SDK: `npm install @lazaruseth/agreement-guard`
- GitHub: https://github.com/lazaruseth/receipts-mvp

## Troubleshooting

- **Capture failed**: Ensure Node.js is installed and the script path is correct
- **No terms found**: Ensure you're extracting the full terms text before capture
