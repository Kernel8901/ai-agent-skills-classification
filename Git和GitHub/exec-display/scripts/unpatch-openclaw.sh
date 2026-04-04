#!/bin/bash
#
# Remove the before_tool_call hook patch from OpenClaw
#
set -e

OPENCLAW_DIR="${OPENCLAW_DIR:-$HOME/src/clawdbot-moltbot-openclaw}"
TARGET_FILE="$OPENCLAW_DIR/src/agents/pi-tool-definition-adapter.ts"
PATCH_MARKER="EXEC-DISPLAY-PATCH"

echo "🔧 OpenClaw Hook Patch Remover"
echo "=============================="
echo ""

# Check if patched
if ! grep -q "$PATCH_MARKER" "$TARGET_FILE"; then
    echo "✅ Not patched. No changes needed."
    exit 0
fi

echo "📝 Removing patch from $TARGET_FILE..."

# Remove the import line
sed -i '/getGlobalHookRunner.*hook-runner-global/d' "$TARGET_FILE"

# Remove the hook block (from PATCH_MARKER to END PATCH_MARKER)
sed -i '/'"$PATCH_MARKER"'/,/END EXEC-DISPLAY-PATCH/d' "$TARGET_FILE"

echo "   Patch removed"

# Verify
if grep -q "$PATCH_MARKER" "$TARGET_FILE"; then
    echo "❌ Removal verification failed - some patch remnants remain"
    exit 1
else
    echo "✅ Patch removed successfully"
fi

# Rebuild
echo ""
echo "🔨 Rebuilding OpenClaw..."
cd "$OPENCLAW_DIR"

if command -v pnpm &> /dev/null; then
    pnpm build
else
    npm run build
fi

echo ""
echo "✅ Done! Restart the OpenClaw gateway to apply changes."
