---
name: MoltiumV2
description: Lightweight Clawhub bootstrap skill for MoltiumV2. Downloads the full RPC-first local toolkit from https://moltium.fun and runs init/doctor.
---

# MoltiumV2 (Clawhub Lite Bootstrap)

This Clawhub upload is intentionally **small** (text-only) to avoid upload limits.
It bootstraps the full MoltiumV2 toolkit from the canonical website:

- Index / docs: https://moltium.fun/skill.md
- Skillpack artifacts:
  - https://moltium.fun/MoltiumV2-skillpack-latest.zip
  - https://moltium.fun/MoltiumV2-skillpack-latest.tar.gz

## Quick start

From the folder where you installed/uploaded this Clawhub skill, run:

```bash
node scripts/bootstrap.mjs
```

Optional environment variables:
- `MOLTIUMV2_DIR` — install target folder (default: `MoltiumV2`)
- `MOLTIUMV2_BASE_URL` — override download base (default: `https://moltium.fun`)

What it does:
- downloads `MoltiumV2-skillpack-latest.tar.gz`
- extracts to `MOLTIUMV2_DIR`
- runs `npm install`
- runs `ctl.mjs init --pretty` (auto-generates wallet if missing)
- runs `ctl.mjs doctor --pretty`

Then fund the printed wallet pubkey before sending real transactions.

## Safety rules (must)

- Never paste seed phrases into chats.
- Start with `--simulate` before real trades.
