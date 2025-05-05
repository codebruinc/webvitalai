#!/bin/bash
# WebVital AI Deployment Script
# This script deploys the WebVital AI application to production

set -e

# Configuration
ENV_FILE=".env.production"
VERCEL_ORG_ID=${VERCEL_ORG_ID:-""}
VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID:-""}
VERCEL_TOKEN=${VERCEL_TOKEN:-""}

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

function check_dependencies() {
  log_info "Checking dependencies..."
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18 or later."
    exit 1
  fi
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm."
    exit 1
  fi
  
  # Check Vercel CLI
  if ! command -v vercel &> /dev/null; then
    log_warn "Vercel CLI is not installed. Installing..."
    npm install -g vercel
  fi
  
  log_info "All dependencies are installed."
}

function check_env_file() {
  log_info "Checking environment file..."
  
  if [ ! -f "$ENV_FILE" ]; then
    log_warn "Environment file $ENV_FILE not found."
    log_info "Creating from template..."
    
    if [ -f ".env.production.template" ]; then
      cp .env.production.template "$ENV_FILE"
      log_warn "Please edit $ENV_FILE with your production values."
      exit 1
    else
      log_error "Template file .env.production.template not found."
      exit 1
    fi
  fi
  
  log_info "Environment file $ENV_FILE exists."
}

function run_tests() {
  log_info "Running tests..."
  npm test
  
  if [ $? -ne 0 ]; then
    log_error "Tests failed. Aborting deployment."
    exit 1
  fi
  
  log_info "Tests passed."
}

function build_app() {
  log_info "Building application..."
  npm run build
  
  if [ $? -ne 0 ]; then
    log_error "Build failed. Aborting deployment."
    exit 1
  fi
  
  log_info "Build completed successfully."
}

function deploy_to_vercel() {
  log_info "Deploying to Vercel..."
  
  if [ -z "$VERCEL_TOKEN" ] || [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
    log_warn "Vercel credentials not set. Please set VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID."
    log_info "Attempting to deploy with login..."
    vercel --prod
  else
    log_info "Using Vercel credentials from environment variables."
    vercel deploy --prod --token="$VERCEL_TOKEN" --scope="$VERCEL_ORG_ID" --confirm
  fi
  
  if [ $? -ne 0 ]; then
    log_error "Deployment to Vercel failed."
    exit 1
  fi
  
  log_info "Deployment to Vercel completed successfully."
}

function setup_worker() {
  log_info "Setting up worker service..."
  
  # This would typically involve deploying the worker to a separate service
  # For example, to a VPS, AWS EC2, or other hosting service
  # For now, we'll just provide instructions
  
  log_info "Worker setup instructions:"
  log_info "1. Deploy the worker.js file to a server with Node.js 18+"
  log_info "2. Install dependencies: npm ci --production"
  log_info "3. Set up environment variables from $ENV_FILE"
  log_info "4. Start the worker with PM2: pm2 start worker.js --name webvitalai-worker"
  log_info "5. Set up PM2 to start on boot: pm2 startup && pm2 save"
}

function verify_deployment() {
  log_info "Verifying deployment..."
  
  # Get the deployment URL from Vercel
  DEPLOYMENT_URL=$(vercel ls --prod --token="$VERCEL_TOKEN" | grep webvitalai | awk '{print $2}')
  
  if [ -z "$DEPLOYMENT_URL" ]; then
    log_warn "Could not get deployment URL. Please verify manually."
  else
    log_info "Checking health endpoint..."
    HEALTH_CHECK=$(curl -s "$DEPLOYMENT_URL/api/health")
    
    if [[ "$HEALTH_CHECK" == *"\"status\":\"ok\""* ]]; then
      log_info "Health check passed."
    else
      log_warn "Health check failed or returned unexpected response."
      log_info "Please verify the deployment manually."
    fi
  fi
}

# Main script
log_info "Starting deployment of WebVital AI..."

check_dependencies
check_env_file
run_tests
build_app
deploy_to_vercel
setup_worker
verify_deployment

log_info "Deployment completed successfully!"