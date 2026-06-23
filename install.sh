#!/usr/bin/env bash

# Solana Escrow Lifecycle Skill Installer
# Configures the custom rules and references for Claude Code / Codex

set -eo pipefail

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m' # No Color

echo -e "${COLOR_BLUE}====================================================${COLOR_NC}"
echo -e "${COLOR_GREEN}Installing Solana Escrow Lifecycle Skill...${COLOR_NC}"
echo -e "${COLOR_BLUE}====================================================${COLOR_NC}"

TARGET_DIR="${1:-.}"

if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${COLOR_YELLOW}Target directory '$TARGET_DIR' does not exist. Creating it...${COLOR_NC}"
    mkdir -p "$TARGET_DIR"
fi

# Ensure rules and skill folders exist in the target
mkdir -p "$TARGET_DIR/.claudecode/rules"
mkdir -p "$TARGET_DIR/.cursor/rules"

echo -e "Copying custom rules to target workspace..."

# Copy security rule
if [ -f "rules/escrow-security.mdc" ]; then
    cp rules/escrow-security.mdc "$TARGET_DIR/.claudecode/rules/escrow-security.mdc"
    cp rules/escrow-security.mdc "$TARGET_DIR/.cursor/rules/escrow-security.mdc"
    echo -e "  - Copied escrow-security.mdc"
else
    echo -e "${COLOR_YELLOW}Warning: rules/escrow-security.mdc not found in current directory.${COLOR_NC}"
fi

# Copy design rule
if [ -f "rules/escrow-design.mdc" ]; then
    cp rules/escrow-design.mdc "$TARGET_DIR/.claudecode/rules/escrow-design.mdc"
    cp rules/escrow-design.mdc "$TARGET_DIR/.cursor/rules/escrow-design.mdc"
    echo -e "  - Copied escrow-design.mdc"
else
    echo -e "${COLOR_YELLOW}Warning: rules/escrow-design.mdc not found in current directory.${COLOR_NC}"
fi

echo -e "${COLOR_GREEN}Skill integration complete!${COLOR_NC}"
echo -e "To use this skill with Claude Code, run:"
echo -e "  ${COLOR_BLUE}claude add-skill $(pwd)/skill/SKILL.md${COLOR_NC}"
echo -e "===================================================="
