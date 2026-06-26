#!/usr/bin/env bash

# Solana Escrow Lifecycle Skill Installer
# Installs the complete skill bundle for Claude Code / Solana AI Kit usage.

set -euo pipefail

SKILL_NAME="solana-escrow-lifecycle"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:---project}"
TARGET_ROOT="${2:-$(pwd)}"

usage() {
    cat <<'USAGE'
Usage:
  bash install.sh [--project [target-dir]]
  bash install.sh --global

Install locations:
  --project  <target-dir>/.claude/skills/solana-escrow-lifecycle
  --global   ~/.claude/skills/solana-escrow-lifecycle

The installer copies skill/, agents/, commands/, rules/, and examples/.
USAGE
}

case "$MODE" in
    --project)
        INSTALL_DIR="$TARGET_ROOT/.claude/skills/$SKILL_NAME"
        ;;
    --global)
        INSTALL_DIR="$HOME/.claude/skills/$SKILL_NAME"
        ;;
    -h|--help)
        usage
        exit 0
        ;;
    *)
        echo "Unknown option: $MODE" >&2
        usage >&2
        exit 1
        ;;
esac

required_dirs=(skill agents commands rules examples)

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$SCRIPT_DIR/$dir" ]; then
        echo "Missing required directory: $dir" >&2
        exit 1
    fi
done

mkdir -p "$INSTALL_DIR"

for dir in "${required_dirs[@]}"; do
    rm -rf "$INSTALL_DIR/$dir"
    cp -R "$SCRIPT_DIR/$dir" "$INSTALL_DIR/$dir"
done

if [ -f "$SCRIPT_DIR/README.md" ]; then
    cp "$SCRIPT_DIR/README.md" "$INSTALL_DIR/README.md"
fi

if [ -f "$SCRIPT_DIR/LICENSE" ]; then
    cp "$SCRIPT_DIR/LICENSE" "$INSTALL_DIR/LICENSE"
fi

cat <<EOF
Installed $SKILL_NAME to:
  $INSTALL_DIR

Claude Code entry point:
  $INSTALL_DIR/skill/SKILL.md

Example:
  claude add-skill "$INSTALL_DIR/skill/SKILL.md"
EOF
