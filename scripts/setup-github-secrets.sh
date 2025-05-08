#!/bin/bash
# Script to set up GitHub Actions secrets for CI/CD

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

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  log_error "GitHub CLI is not installed. Please install it first: https://cli.github.com/"
  exit 1
fi

# Check if logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
  log_error "You are not logged in to GitHub CLI. Please run 'gh auth login' first."
  exit 1
fi

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
  log_error "Could not determine the GitHub repository. Please run this script from a GitHub repository."
  exit 1
fi

log_info "Setting up GitHub Actions secrets for repository: $REPO"

# Function to set a secret
function set_secret() {
  local name=$1
  local prompt=$2
  local default=$3
  
  if [ -n "$default" ]; then
    prompt="$prompt (default: $default)"
  fi
  
  read -p "$prompt: " value
  
  if [ -z "$value" ] && [ -n "$default" ]; then
    value="$default"
  fi
  
  if [ -z "$value" ]; then
    log_warn "No value provided for $name. Skipping."
    return
  fi
  
  echo "$value" | gh secret set "$name" --repo "$REPO"
  log_info "Secret $name set successfully."
}

# Set Vercel secrets
log_info "Setting up Vercel deployment secrets..."
set_secret "VERCEL_TOKEN" "Enter your Vercel API token"
set_secret "VERCEL_ORG_ID" "Enter your Vercel organization ID"
set_secret "VERCEL_PROJECT_ID" "Enter your Vercel project ID"

# Set Supabase secrets
log_info "Setting up Supabase secrets..."
set_secret "NEXT_PUBLIC_SUPABASE_URL" "Enter your Supabase URL"
set_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Enter your Supabase anonymous key"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "Enter your Supabase service role key"

# Set API keys
log_info "Setting up API keys..."
set_secret "OPENAI_API_KEY" "Enter your OpenAI API key"
set_secret "SECURITY_HEADERS_API_KEY" "Enter your SecurityHeaders.com API key"

# Set Stripe secrets
log_info "Setting up Stripe secrets..."
set_secret "STRIPE_SECRET_KEY" "Enter your Stripe secret key"
set_secret "STRIPE_PUBLISHABLE_KEY" "Enter your Stripe publishable key"
set_secret "STRIPE_WEBHOOK_SECRET" "Enter your Stripe webhook secret"
set_secret "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Enter your Stripe publishable key (for frontend)"
set_secret "NEXT_PUBLIC_STRIPE_PRICE_ID" "Enter your Stripe price ID for the subscription"

# Set Redis secrets
log_info "Setting up Redis secrets..."
set_secret "REDIS_URL" "Enter your Redis URL"

# Set Sentry secrets
log_info "Setting up Sentry secrets..."
set_secret "SENTRY_DSN" "Enter your Sentry DSN"
set_secret "NEXT_PUBLIC_SENTRY_DSN" "Enter your Sentry DSN (for frontend)"

# Set other environment variables
log_info "Setting up other environment variables..."
set_secret "NEXT_PUBLIC_BASE_URL" "Enter your production base URL" "https://webvitalai.com"
set_secret "CRON_SECRET" "Enter a secret for securing cron job endpoints" "$(openssl rand -hex 32)"

log_info "All secrets have been set up successfully!"
log_info "You can now use GitHub Actions for CI/CD."