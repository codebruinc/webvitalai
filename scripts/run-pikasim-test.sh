#!/bin/bash

# This script runs all the necessary steps to fix Chromium issues and test the scan functionality with pikasim.com

# Set error handling
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Function to print section headers
print_header() {
  echo ""
  echo "============================================================"
  echo "  $1"
  echo "============================================================"
  echo ""
}

# Function to print status messages
print_status() {
  echo ">> $1"
}

# Make all scripts executable
print_header "Making scripts executable"
bash "$SCRIPT_DIR/make-test-scripts-executable.sh"

# Step 1: Fix Chromium path issues
print_header "Step 1: Fixing Chromium path issues"
node "$SCRIPT_DIR/fix-chromium-path.cjs"

# Step 2: Verify Chromium setup
print_header "Step 2: Verifying Chromium setup"
node "$SCRIPT_DIR/verify-chromium-setup.cjs"

# Step 3: Test Axe audit
print_header "Step 3: Testing Axe audit with pikasim.com"
node "$SCRIPT_DIR/test-axe-audit.cjs"

# Step 4: Test Lighthouse audit
print_header "Step 4: Testing Lighthouse audit with pikasim.com"
node "$SCRIPT_DIR/test-lighthouse-audit.cjs"

# Step 5: Run the full scan test
print_header "Step 5: Running full scan test with pikasim.com"
node "$SCRIPT_DIR/test-pikasim-scan.cjs"

print_header "Test Summary"
echo "All tests have been completed!"
echo ""
echo "If any tests failed, please check the logs for details."
echo "You can run individual test scripts to troubleshoot specific issues:"
echo ""
echo "  - Fix Chromium path:       node $SCRIPT_DIR/fix-chromium-path.cjs"
echo "  - Verify Chromium setup:   node $SCRIPT_DIR/verify-chromium-setup.cjs"
echo "  - Test Axe audit:          node $SCRIPT_DIR/test-axe-audit.cjs"
echo "  - Test Lighthouse audit:   node $SCRIPT_DIR/test-lighthouse-audit.cjs"
echo "  - Run full scan test:      node $SCRIPT_DIR/test-pikasim-scan.cjs"
echo ""
echo "For more detailed logs, check the output above."
