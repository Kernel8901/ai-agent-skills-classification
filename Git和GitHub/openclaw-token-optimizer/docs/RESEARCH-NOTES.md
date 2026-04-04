# Research Notes: Skill Marketplaces

Research conducted 2026-02-06 by Morpheus.

## ClawHub.ai

**URL:** https://clawhub.ai  
**GitHub:** https://github.com/openclaw/clawhub

### What It Is
- Public skill registry for OpenClaw/Clawdbot
- Publish, version, and search text-based agent skills
- Vector search for discovery (not just keywords)
- Star, comment, and moderation features

### Skill Format Requirements

**SKILL.md Required Structure:**
```yaml
---
name: skill-name
description: One-line description of what the skill does
version: 1.0.0  # Optional but recommended
homepage: https://github.com/...  # Optional
metadata: {"openclaw":{...}}  # Optional but recommended for ClawHub
---

# Instructions and documentation...
```

**metadata.openclaw Fields:**
- `emoji` — Icon for the skill
- `homepage` — URL shown as "Website" in UI
- `requires.bins` — Required binaries (e.g., ["python3"])
- `requires.env` — Required environment variables
- `requires.config` — Required OpenClaw config paths
- `primaryEnv` — Main API key environment variable
- `install` — Array of installer specs (brew/node/go/uv/download)

### Publishing

```bash
# Install ClawHub CLI
clawhub install

# Publish skill
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.2.0 --changelog "Fixes + docs"

# Update all installed skills
clawhub update --all
```

### What Makes Skills "Outstanding"

Based on browsing ClawHub and OpenClaw docs:

1. **Clear SKILL.md** with proper YAML frontmatter
2. **One-line installation** instructions
3. **Works out-of-box** with minimal config
4. **Proper version** and changelog
5. **Good documentation** with examples
6. **metadata.openclaw** with requirements spelled out
7. **No external dependencies** if possible (stdlib only)

---

## SkillsMP.com

**Status:** Could not fully research (403 Cloudflare protection)

**What We Know:**
- skills.sh appears to be related (skills.sh/openclaw/openclaw/clawhub)
- May be an alternative skill directory
- Need browser access to fully research

**Recommendation:** Focus on ClawHub first as it's the official OpenClaw registry.

---

## onlycrabs.ai

**URL:** https://onlycrabs.ai

A SOUL.md registry (companion to ClawHub):
- Publish and share system lore (personality files)
- Same format principles as skills
- SOUL.md only (no extra files for now)

---

## OpenClaw Skills System

**Documentation:** https://docs.openclaw.ai/tools/skills

### Skill Locations (Precedence)
1. `<workspace>/skills` — Highest priority, per-agent
2. `~/.openclaw/skills` — Managed/local, shared across agents
3. Bundled skills — Lowest priority, shipped with OpenClaw

### AgentSkills Spec
- OpenClaw uses AgentSkills-compatible format
- Each skill is a directory with SKILL.md + supporting files
- YAML frontmatter parsed at load time
- `{baseDir}` can reference skill folder path in instructions

### Gating (Load-time Filters)
Skills can be filtered by:
- Required binaries (`requires.bins`)
- Environment variables (`requires.env`)
- OpenClaw config paths (`requires.config`)
- OS platform (`os: ["darwin", "linux", "win32"]`)

### Config Overrides
In `~/.openclaw/openclaw.json`:
```json
{
  "skills": {
    "entries": {
      "token-optimizer": {
        "enabled": true,
        "env": {
          "SOME_VAR": "value"
        }
      }
    }
  }
}
```

---

## Token Optimizer Changes Made

### v1.1.0 Updates

1. **Multi-Provider Support**
   - Added OpenAI: gpt-4.1-nano → gpt-4.1-mini → gpt-4.1 → gpt-5
   - Added Google: gemini-2.0-flash → gemini-2.5-flash → gemini-2.5-pro
   - Added OpenRouter: unified API with failover
   - Auto-detection based on available API keys

2. **Provider-Agnostic Tiers**
   - cheap = Haiku / Nano / Flash
   - balanced = Sonnet / Mini / 2.5 Flash
   - smart = Opus / GPT-4.1 / Pro
   - premium = GPT-5 (OpenAI only)

3. **New CLI Commands**
   - `model_router.py compare` — Show all models across providers
   - `model_router.py providers` — List available providers
   - `model_router.py detect` — Show auto-detected provider

4. **ClawHub-Ready SKILL.md**
   - Proper YAML frontmatter with metadata
   - One-line installation instructions
   - Complete script reference
   - Integration patterns

5. **CHANGELOG.md**
   - Semver format
   - Keep a Changelog standard
   - Version history table

6. **Updated Documentation**
   - README with quick start
   - PROVIDERS.md with full comparison
   - Better examples throughout

---

## Recommendations for Future

1. **Publish to ClawHub** once credentials available
2. **Add installer spec** for automated setup
3. **Consider Python package** for pip install
4. **Add tests** for model routing logic
5. **Dashboard integration** for real-time cost tracking
