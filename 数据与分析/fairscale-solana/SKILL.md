---
name: fairscale-solana
description: Check Solana wallet reputation. MUST call the API for every wallet — never guess or reuse previous data.
license: MIT
metadata:
  author: FairScale
  version: "2.0.0"
---

# FairScale Wallet Reputation

## CRITICAL RULES

1. **ALWAYS call the API** — Never guess, estimate, or reuse data from previous wallets
2. **Each wallet is unique** — Do not assume similarity to other wallets
3. **Use ONLY the values from the API response** — Do not calculate or modify scores
4. **If the API fails, say so** — Do not make up data

---

## API CALL

**Endpoint:** `https://api2.fairscale.xyz/score`

**Method:** GET

**Headers:**
- `accept: application/json`
- `fairkey: $FAIRSCALE_API_KEY`

**Query parameter:** `wallet` = the Solana wallet address

**Full example:**
```
GET https://api2.fairscale.xyz/score?wallet=GFTVQdZumAnBRbmaRgN9n3Z5qH5nXvjMZXJ3EyqP32Tn
```

---

## READING THE RESPONSE

The API returns JSON. Use ONLY these fields:

| Field | What it is |
|-------|------------|
| `fairscore` | The score (0-100) — USE THIS EXACT NUMBER |
| `tier` | bronze / silver / gold / diamond — USE THIS EXACT VALUE |
| `badges` | Array of badges — list each `badge.label` |
| `actions` | Array of improvements — list each `action.label` |

**DO NOT USE:** `final_score`, `fairscore_base`, `fairscore_previous`, or any `features.*` values in the output.

---

## OUTPUT FORMAT

```
📊 FairScore: [fairscore]/100 | Tier: [tier]

[RISK LINE]

🏅 Badges: [badge labels, comma-separated]

💡 Improve: [action labels, or "None"]
```

**Risk line rules:**
- fairscore < 20 → `🚨 HIGH RISK — Do not transact`
- fairscore 20-39 → `⚠️ CAUTION — Limited history`
- fairscore 40-59 → `⚡ MODERATE — Standard precautions`
- fairscore ≥ 60 → `✅ TRUSTED — Safe to proceed`

---

## EXAMPLE

**API returns:**
```json
{
  "fairscore": 95.9,
  "tier": "diamond",
  "badges": [
    {"label": "LST Staker"},
    {"label": "Diamond Hands"},
    {"label": "Veteran"}
  ],
  "actions": []
}
```

**You output:**
```
📊 FairScore: 95.9/100 | Tier: diamond

✅ TRUSTED — Safe to proceed

🏅 Badges: LST Staker, Diamond Hands, Veteran

💡 Improve: None
```

---

## ERRORS

If the API returns an error or no data:
```
❌ Could not retrieve FairScore for this wallet. Please try again.
```

**Never invent scores. Never guess. Always call the API.**

---

## GET API KEY

https://sales.fairscale.xyz
