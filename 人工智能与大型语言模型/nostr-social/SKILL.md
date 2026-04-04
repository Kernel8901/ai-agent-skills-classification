---
name: Nostr
description: Your agent wants a social life. Give it one. This skill gives your agent its own Nostr identity + ecash wallet. One mnemonic backs up everything (NIP-06). Not for you — for your agent. It owns its own keys, its own sats, posts as itself. One install, automatic bootstrap, no third parties.
tags: nostr, bitcoin, lightning, cashu, identity, social, wallet
---

# Nostr Skill

Self-sovereign Nostr identity + ecash wallet. Complete bootstrap.

## Capabilities Disclosure

This skill grants these capabilities to the agent:

- **Key generation** — Creates Nostr keypair in `~/.nostr/secret.key`
- **Wallet control** — Cashu wallet in `~/.cocod/`, can send/receive sats
- **File read** — Can read local images for upload (only when explicitly requested)
- **Network upload** — Uploads images to nostr.build (NIP-98 signed)
- **Nostr posting** — Posts, DMs, zaps as the agent's identity

These are required for the skill's purpose. The agent does NOT access user keys, wallets, or files without explicit commands.

## On Install

When skill is installed (user pastes ClawHub link), run this flow:

### Step 1: Silent Setup

```bash
# Install dependencies
bash {SKILL_DIR}/install.sh

# Create wallet FIRST (generates mnemonic)
cocod init
# CAPTURE 24-word mnemonic from output

# Create Nostr identity - derives from wallet mnemonic (NIP-06)
# This ensures ONE mnemonic backs up both wallet AND identity
node {SKILL_DIR}/scripts/nostr.js init

# Get identity info
NPUB=$(node {SKILL_DIR}/scripts/nostr.js whoami | grep npub | awk '{print $2}')
LN_ADDR=$(cocod npc address)

# Set basic profile (name/about from SOUL.md, Lightning address)
# Images are set later after asking user
node {SKILL_DIR}/scripts/nostr.js profile-set '{"name":"<NAME>","about":"<ABOUT>","lud16":"'$LN_ADDR'"}'
```

**Note:** Nostr identity is derived from wallet mnemonic using NIP-06. This means:
- One mnemonic backs up everything (wallet + identity)
- npubx.cash username works for BOTH Lightning AND NIP-05 verification

### Step 2: Report Results + Backup Prompt

Reply to user:

---

⚡ **Your Nostr identity is ready!**

**npub:** `npub1...`

**Lightning address:** `npub1...@npubx.cash`

**Profile set** ✓

---

⚠️ **BACKUP THIS NOW** — it won't be shown again.

**Recovery phrase (backs up EVERYTHING):**
```
word1 word2 word3 ... word24
```

This single mnemonic recovers both your Nostr identity AND ecash wallet.

Lose this = lose access forever.

**Reply "saved" when you've backed them up.**

---

### Step 3: Wait for "saved"

Do not proceed until user confirms backup.

### Step 4: Ask for Owner's npub

---

**What's your Nostr npub?**

I'll follow you so we stay connected.

(Paste your npub1... or NIP-05 like you@domain.com)

---

Then:
```bash
# If NIP-05, resolve first
node {SKILL_DIR}/scripts/nostr.js lookup <nip05>

# Follow owner
node {SKILL_DIR}/scripts/nostr.js follow <owner_npub>
```

### Step 5: Ask for Profile Images

---

**Do you have profile images for me?**

- **Avatar:** Paste URL (square, 400x400 recommended)
- **Banner:** Paste URL (wide, 1500x500 recommended)

Or say "skip" and I'll generate unique ones automatically.

---

If URLs provided:
```bash
node {SKILL_DIR}/scripts/nostr.js profile-set '{"picture":"<avatar_url>","banner":"<banner_url>"}'
```

If skipped, use DiceBear (deterministic, unique per npub):
```bash
AVATAR="https://api.dicebear.com/7.x/shapes/png?seed=${NPUB}&size=400"
BANNER="https://api.dicebear.com/7.x/shapes/png?seed=${NPUB}-banner&size=1500x500"
node {SKILL_DIR}/scripts/nostr.js profile-set '{"picture":"'$AVATAR'","banner":"'$BANNER'"}'
```

### Step 6: First Post

---

**Ready for your first post?**

Tell me what to post, or say "skip".

Suggestion: "Hello Nostr! ⚡"

Tell me what to post, or say "skip".

Suggestion: "Hello Nostr! ⚡"

---

If user provides text:
```bash
node {SKILL_DIR}/scripts/nostr.js post "<user's message>"
```

### Step 6: Done

---

✅ **All set!**

- Following you ✓
- First post live ✓ (if not skipped)

Try: "check my mentions" or "post <message>"

---

## Commands Reference

### Posting
```bash
node {SKILL_DIR}/scripts/nostr.js post "message"
node {SKILL_DIR}/scripts/nostr.js reply <note1...> "text"
node {SKILL_DIR}/scripts/nostr.js react <note1...> 🔥
node {SKILL_DIR}/scripts/nostr.js repost <note1...>
node {SKILL_DIR}/scripts/nostr.js delete <note1...>
```

### Reading
```bash
node {SKILL_DIR}/scripts/nostr.js mentions 20
node {SKILL_DIR}/scripts/nostr.js feed 20
```

### Connections
```bash
node {SKILL_DIR}/scripts/nostr.js follow <npub>
node {SKILL_DIR}/scripts/nostr.js unfollow <npub>
node {SKILL_DIR}/scripts/nostr.js mute <npub>
node {SKILL_DIR}/scripts/nostr.js unmute <npub>
node {SKILL_DIR}/scripts/nostr.js lookup <nip05>
```

### DMs
```bash
node {SKILL_DIR}/scripts/nostr.js dm <npub> "message"
node {SKILL_DIR}/scripts/nostr.js dms 10
```

### Zaps
```bash
# Get invoice
node {SKILL_DIR}/scripts/nostr.js zap <npub> 100 "comment"
# Pay it
cocod send bolt11 <invoice>
```

### Wallet
```bash
cocod balance
cocod receive bolt11 1000    # Create invoice
cocod send bolt11 <invoice>  # Pay invoice
cocod npc address            # Lightning address
```

### Profile
```bash
node {SKILL_DIR}/scripts/nostr.js whoami
node {SKILL_DIR}/scripts/nostr.js profile
node {SKILL_DIR}/scripts/nostr.js profile "Name" "Bio"
node {SKILL_DIR}/scripts/nostr.js profile-set '{"name":"X","picture":"URL","lud16":"addr"}'
```

### Bookmarks
```bash
node {SKILL_DIR}/scripts/nostr.js bookmark <note1...>
node {SKILL_DIR}/scripts/nostr.js unbookmark <note1...>
node {SKILL_DIR}/scripts/nostr.js bookmarks
```

### Relays
```bash
node {SKILL_DIR}/scripts/nostr.js relays
node {SKILL_DIR}/scripts/nostr.js relays add <url>
node {SKILL_DIR}/scripts/nostr.js relays remove <url>
```

## User Phrases → Actions

| User says | Action |
|-----------|--------|
| "post X" | `nostr.js post "X"` |
| "reply to X with Y" | `nostr.js reply <note> "Y"` |
| "check mentions" | `nostr.js mentions` |
| "my feed" | `nostr.js feed` |
| "follow X" | Lookup if NIP-05 → `nostr.js follow` |
| "DM X message" | `nostr.js dm <npub> "message"` |
| "zap X 100 sats" | `nostr.js zap` → `cocod send bolt11` |
| "balance" | `cocod balance` |
| "invoice for 1000" | `cocod receive bolt11 1000` |
| "my npub" | `nostr.js whoami` |
| "my lightning address" | `cocod npc address` |

## Image Upload

For custom avatar/banner (not robohash):

```bash
# Upload image to nostr.build (NIP-98 authenticated)
node {SKILL_DIR}/scripts/nostr.js upload /path/to/image.png
# → https://image.nostr.build/abc123.png

# Set in profile
node {SKILL_DIR}/scripts/nostr.js profile-set '{"picture":"https://image.nostr.build/abc123.png"}'
```

## Defaults

| Setting | Value |
|---------|-------|
| Mint | `https://mint.minibits.cash/Bitcoin` |
| Lightning domain | `@npubx.cash` |
| Avatar fallback | `https://api.dicebear.com/7.x/shapes/png?seed=<npub>` |
| Image host | `nostr.build` (NIP-98 auth) |
| Nostr key | `~/.nostr/secret.key` |
| Wallet data | `~/.cocod/` |

## Integration

### SOUL.md
- Pull name/about from SOUL.md or IDENTITY.md
- Match posting voice/tone to agent's personality
- Don't be generic - posts should sound like the agent

### HEARTBEAT.md
Add to heartbeat rotation (every 2-4 hours):
```bash
# Check Nostr activity
node {SKILL_DIR}/scripts/nostr.js mentions 10
node {SKILL_DIR}/scripts/nostr.js dms 5
```
If mentions from WoT or zaps received → notify user.

### TOOLS.md
After setup, store for quick reference:
```markdown
## Nostr
- npub: npub1...
- Lightning: npub1...@npubx.cash  
- Owner: npub1... (followed)
```

## Profile Sources

- **Name**: IDENTITY.md or SOUL.md
- **About**: SOUL.md description
- **Picture**: User-provided URL, or DiceBear fallback
- **Banner**: User-provided URL, or DiceBear fallback
- **lud16**: From `cocod npc address`
