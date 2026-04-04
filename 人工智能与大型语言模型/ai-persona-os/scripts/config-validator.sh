#!/bin/bash
# AI Persona OS — Config Validator
# Checks all required OpenClaw/Clawdbot settings and flags what's missing
# Run: ./scripts/config-validator.sh

echo "🔍 AI Persona OS Config Validator"
echo "================================="
echo ""

ISSUES=0
WARNINGS=0

# Find config file
CONFIG_FILE=""
for f in openclaw.json clawdbot-mac.json clawdbot.json; do
  if [ -f "$HOME/.openclaw/$f" ]; then
    CONFIG_FILE="$HOME/.openclaw/$f"
    break
  fi
  if [ -f "$f" ]; then
    CONFIG_FILE="$f"
    break
  fi
done

if [ -z "$CONFIG_FILE" ]; then
  echo "❌ No config file found (checked openclaw.json, clawdbot-mac.json, clawdbot.json)"
  echo "   Location checked: ~/.openclaw/ and current directory"
  ISSUES=$((ISSUES + 1))
else
  echo "✅ Config file: $CONFIG_FILE"
  
  # Check heartbeat config
  echo ""
  echo "## Heartbeat Configuration"
  
  if grep -q '"heartbeat"' "$CONFIG_FILE" 2>/dev/null; then
    echo "✅ Heartbeat section exists"
    
    if grep -q '"every"' "$CONFIG_FILE" 2>/dev/null; then
      echo "✅ heartbeat.every is set"
    else
      echo "❌ heartbeat.every is MISSING — heartbeats won't auto-fire"
      echo "   Fix: Add \"every\": \"30m\" to heartbeat config"
      ISSUES=$((ISSUES + 1))
    fi
    
    if grep -q '"target"' "$CONFIG_FILE" 2>/dev/null; then
      echo "✅ heartbeat.target is set"
    else
      echo "❌ heartbeat.target is MISSING — heartbeats won't route correctly"
      echo "   Fix: Add \"target\": \"last\" to heartbeat config"
      ISSUES=$((ISSUES + 1))
    fi
    
    if grep -q '"ackMaxChars"' "$CONFIG_FILE" 2>/dev/null; then
      echo "✅ heartbeat.ackMaxChars is set (HEARTBEAT_OK suppression)"
    else
      echo "⚠️  heartbeat.ackMaxChars is MISSING — HEARTBEAT_OK will show in chat"
      echo "   Fix: Add \"ackMaxChars\": 20 to heartbeat config"
      WARNINGS=$((WARNINGS + 1))
    fi
    
    if grep -q '"prompt"' "$CONFIG_FILE" 2>/dev/null; then
      echo "✅ heartbeat.prompt override is set"
    else
      echo "⚠️  heartbeat.prompt is MISSING — agent may use old format"
      echo "   Fix: Add prompt override (see references/heartbeat-automation.md)"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo "❌ No heartbeat section found"
    echo "   Fix: Add heartbeat config to agents.defaults (see references/heartbeat-automation.md)"
    ISSUES=$((ISSUES + 1))
  fi
  
  # Check Discord requireMention
  echo ""
  echo "## Discord Configuration"
  
  if grep -q '"guilds"' "$CONFIG_FILE" 2>/dev/null; then
    GUILD_COUNT=$(grep -c '"requireMention"' "$CONFIG_FILE" 2>/dev/null || echo "0")
    if [ "$GUILD_COUNT" -gt 0 ]; then
      echo "✅ requireMention found for $GUILD_COUNT guild(s)"
      
      # Check if any guild is missing requireMention
      # (simplified check — counts guilds vs requireMention entries)
      TOTAL_GUILDS=$(grep -c '"[0-9]\{17,\}"' "$CONFIG_FILE" 2>/dev/null || echo "0")
      if [ "$GUILD_COUNT" -lt "$TOTAL_GUILDS" ]; then
        echo "⚠️  Some guilds may be missing requireMention: true"
        echo "   Fix: Set requireMention: true for ALL Discord guilds"
        WARNINGS=$((WARNINGS + 1))
      fi
    else
      echo "⚠️  No requireMention settings found — agent may respond uninvited"
      echo "   Fix: Add requireMention: true for all Discord guilds"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo "ℹ️  No Discord guilds configured (OK if not using Discord)"
  fi
fi

# Check workspace files
echo ""
echo "## Workspace Files"

for f in SOUL.md USER.md MEMORY.md AGENTS.md HEARTBEAT.md SECURITY.md; do
  if [ -f "$f" ]; then
    SIZE=$(wc -c < "$f")
    if [ "$f" = "MEMORY.md" ] && [ "$SIZE" -gt 4096 ]; then
      echo "⚠️  $f exists ($SIZE bytes — EXCEEDS 4KB LIMIT)"
      echo "   Fix: Prune MEMORY.md — archive old facts to memory/"
      WARNINGS=$((WARNINGS + 1))
    else
      echo "✅ $f exists ($SIZE bytes)"
    fi
  else
    echo "❌ $f is MISSING"
    echo "   Fix: Copy from skill assets/ or run setup wizard"
    ISSUES=$((ISSUES + 1))
  fi
done

# Check VERSION.md file
echo ""
echo "## Version Tracking"

if [ -f "VERSION" ]; then
  VERSION=$(cat VERSION | tr -d '[:space:]')
  echo "✅ VERSION.md file: v$VERSION"
else
  echo "⚠️  No VERSION.md file in workspace"
  echo "   Fix: Copy from skill assets/VERSION.md"
  WARNINGS=$((WARNINGS + 1))
fi

# Check HEARTBEAT.md size (old template detection)
if [ -f "HEARTBEAT.md" ]; then
  LINES=$(wc -l < "HEARTBEAT.md")
  if [ "$LINES" -gt 50 ]; then
    echo ""
    echo "⚠️  HEARTBEAT.md is $LINES lines — likely the OLD template"
    echo "   Fix: Replace with assets/HEARTBEAT-template.md"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Check memory directory
echo ""
echo "## Memory System"

if [ -d "memory" ]; then
  LOG_COUNT=$(ls memory/*.md 2>/dev/null | wc -l)
  echo "✅ memory/ directory exists ($LOG_COUNT log files)"
  
  if [ -d "memory/archive" ]; then
    echo "✅ memory/archive/ exists"
  else
    echo "⚠️  memory/archive/ missing"
    echo "   Fix: mkdir -p memory/archive"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Check for stale logs
  OLD_LOGS=$(find memory/ -maxdepth 1 -name "*.md" -mtime +90 2>/dev/null | wc -l)
  if [ "$OLD_LOGS" -gt 0 ]; then
    echo "⚠️  $OLD_LOGS log files older than 90 days — should be archived"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "❌ memory/ directory missing"
  echo "   Fix: mkdir -p memory/archive"
  ISSUES=$((ISSUES + 1))
fi

# Check learnings directory
if [ -d ".learnings" ]; then
  echo "✅ .learnings/ directory exists"
else
  echo "⚠️  .learnings/ directory missing"
  echo "   Fix: mkdir -p .learnings"
  WARNINGS=$((WARNINGS + 1))
fi

# Check ESCALATION.md
echo ""
echo "## Escalation Protocol"

if [ -f "ESCALATION.md" ]; then
  echo "✅ ESCALATION.md exists"
else
  echo "⚠️  ESCALATION.md missing — agent won't follow structured handoff"
  echo "   Fix: Copy from skill assets/ESCALATION-template.md"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "================================="
echo "Summary: $ISSUES issues, $WARNINGS warnings"
if [ "$ISSUES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo "🟢 All checks passed — system is healthy"
elif [ "$ISSUES" -eq 0 ]; then
  echo "🟡 No critical issues — $WARNINGS items to improve"
else
  echo "🔴 $ISSUES critical issues need fixing"
fi
echo ""
