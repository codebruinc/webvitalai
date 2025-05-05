#!/bin/bash
# Script to update dependencies for production deployment

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
log_info "Updating dependencies for production deployment..."

# Install Sentry for error tracking
log_info "Installing Sentry..."
npm install --save @sentry/nextjs

# Install Redis client for Bull queue
log_info "Installing Redis client..."
npm install --save ioredis

# Install compression for response compression
log_info "Installing compression middleware..."
npm install --save compression

# Install monitoring tools
log_info "Installing monitoring tools..."
npm install --save prom-client

# Install security packages
log_info "Installing security packages..."
npm install --save helmet
npm install --save cors

# Install development dependencies
log_info "Installing development dependencies..."
npm install --save-dev cross-env
npm install --save-dev dotenv-cli

# Update package.json scripts
log_info "Updating package.json scripts..."

# Create a temporary file with the updated scripts
cat > temp-scripts.json << EOL
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "worker": "node worker.js",
    "deploy": "bash scripts/deploy.sh",
    "build:standalone": "cross-env STANDALONE=true next build",
    "analyze": "cross-env ANALYZE=true next build",
    "start:prod": "cross-env NODE_ENV=production next start",
    "docker:build": "docker build -t webvitalai:latest .",
    "docker:worker": "docker build -t webvitalai-worker:latest -f Dockerfile.worker .",
    "docker:compose": "docker-compose up -d",
    "docker:compose:down": "docker-compose down"
  }
}
EOL

# Use jq to merge the scripts into package.json
if command -v jq &> /dev/null; then
  log_info "Using jq to update package.json..."
  jq -s '.[0] * {scripts: .[1].scripts}' package.json temp-scripts.json > package.json.new
  mv package.json.new package.json
  rm temp-scripts.json
else
  log_warn "jq is not installed. Please manually update the scripts in package.json with the contents of temp-scripts.json."
  log_info "You can install jq with: brew install jq (macOS) or apt-get install jq (Linux)"
fi

log_info "Dependencies updated successfully!"
log_info "Please run 'npm install' to install the new dependencies."