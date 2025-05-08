#!/bin/bash

# This script makes all the test and fix scripts executable

echo "Making test and fix scripts executable..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Make all .cjs files executable
echo "Making .cjs files executable..."
chmod +x "$SCRIPT_DIR"/*.cjs

# Make all .sh files executable
echo "Making .sh files executable..."
chmod +x "$SCRIPT_DIR"/*.sh

# List of specific scripts to make executable
SCRIPTS=(
  "test-pikasim-scan.cjs"
  "test-axe-audit.cjs"
  "test-lighthouse-audit.cjs"
  "fix-chromium-path.cjs"
  "verify-chromium-setup.cjs"
  "set-chromium-path.cjs"
  "install-puppeteer-deps.cjs"
  "fix-chromium-issues.cjs"
  "run-lighthouse.cjs"
  "lighthouse-wrapper.cjs"
  "setup-chromium-symlink.cjs"
  "make-chromium-scripts-executable.sh"
)

# Make each script executable
for script in "${SCRIPTS[@]}"; do
  if [ -f "$SCRIPT_DIR/$script" ]; then
    echo "Making $script executable..."
    chmod +x "$SCRIPT_DIR/$script"
  else
    echo "Warning: $script not found"
  fi
done

echo "All scripts are now executable!"
