#!/bin/bash
# Script to make all deployment scripts executable

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
function log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

function log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

function log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Main script
log_info "Making deployment scripts executable..."

# Make all scripts in the scripts directory executable
chmod +x scripts/*.sh

log_info "Scripts made executable:"
ls -la scripts/*.sh

log_info "All scripts are now executable."