#!/bin/bash
# Nostr Skill - Silent installation (agent runs this)
set -e

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install cocod if needed
if ! command -v cocod &> /dev/null; then
    npm install -g cocod 2>/dev/null
fi

# Install Node dependencies
cd "$SKILL_DIR/scripts"
npm install --quiet 2>/dev/null

echo "OK"
