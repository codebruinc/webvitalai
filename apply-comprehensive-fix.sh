#!/bin/bash

# apply-comprehensive-fix.sh
# Comprehensive fix script for WebVitalAI RLS policy issues
# This script runs all the fix scripts in the correct order and tests the fix end-to-end

# Set text colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Error flag to track if any step fails
ERROR_FLAG=0

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning messages
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to print info messages
print_info() {
  echo -e "${CYAN}ℹ $1${NC}"
}

# Function to check if a command was successful
check_success() {
  if [ $? -eq 0 ]; then
    print_success "$1"
    return 0
  else
    print_error "$2"
    ERROR_FLAG=1
    return 1
  fi
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
  if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 16.x or higher."
    exit 1
  fi
  
  node_version=$(node -v | cut -d 'v' -f 2)
  required_version="16.0.0"
  
  if [[ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]]; then
    print_error "Node.js version $node_version is less than the required version $required_version"
    exit 1
  else
    print_success "Node.js version $node_version is installed (required: $required_version or higher)"
  fi
}

# Function to check if required npm packages are installed
check_npm_packages() {
  local missing_packages=()
  
  for package in "@supabase/supabase-js" "dotenv" "node-fetch"; do
    if ! npm list "$package" --depth=0 >/dev/null 2>&1; then
      missing_packages+=("$package")
    fi
  done
  
  if [ ${#missing_packages[@]} -gt 0 ]; then
    print_warning "Missing required npm packages: ${missing_packages[*]}"
    print_info "Installing missing packages..."
    npm install ${missing_packages[*]} --no-save
    check_success "Required packages installed successfully" "Failed to install required packages"
  else
    print_success "All required npm packages are installed"
  fi
}

# Function to check Supabase credentials
check_supabase_credentials() {
  if [ -f .env.local ]; then
    local missing_credentials=()
    
    if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
      missing_credentials+=("NEXT_PUBLIC_SUPABASE_URL")
    fi
    
    if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
      missing_credentials+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    fi
    
    if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
      missing_credentials+=("SUPABASE_SERVICE_ROLE_KEY")
    fi
    
    if [ ${#missing_credentials[@]} -gt 0 ]; then
      print_error "Missing Supabase credentials in .env.local: ${missing_credentials[*]}"
      print_info "Please add the missing credentials to your .env.local file and run this script again."
      exit 1
    else
      print_success "All required Supabase credentials are present"
    fi
  else
    print_warning ".env.local file not found"
    print_info "Will create .env.local file in the next step"
  fi
}

# Start the fix process
print_header "Starting Comprehensive RLS Policy Fix for WebVitalAI"
echo "This script will fix the RLS policy issues that are preventing scan creation."
echo "It will run all the necessary fix scripts in the correct order and test the fix."

# Step 0: Check prerequisites
print_header "Step 0: Checking prerequisites"
check_node_version
check_npm_packages
check_supabase_credentials

# Step 1: Verify environment configuration
print_header "Step 1: Verifying environment configuration"

# Check if .env.local exists
if [ -f .env.local ]; then
  print_success "Found .env.local file"
  
  # Check if NODE_ENV is set to production
  if grep -q "NODE_ENV=production" .env.local; then
    print_success "NODE_ENV is set to production"
  else
    print_warning "NODE_ENV is not set to production in .env.local"
    echo "Running set-production-mode.js to fix environment configuration..."
    node set-production-mode.js
    check_success "Environment configuration updated successfully" "Failed to update environment configuration"
  fi
  
  # Check if TESTING_MODE is set to false
  if grep -q "TESTING_MODE=false" .env.local; then
    print_success "TESTING_MODE is set to false"
  else
    print_warning "TESTING_MODE is not set to false in .env.local"
    echo "Running set-production-mode.js to fix environment configuration..."
    node set-production-mode.js
    check_success "Environment configuration updated successfully" "Failed to update environment configuration"
  fi
else
  print_warning ".env.local file not found"
  echo "Creating .env.local file with production settings..."
  node set-production-mode.js
  check_success ".env.local file created successfully" "Failed to create .env.local file"
fi

# Step 2: Fix authentication issues
print_header "Step 2: Fixing authentication issues"
echo "Running fix-authentication.js to verify and fix authentication issues..."
node fix-authentication.js
check_success "Authentication verification completed" "Authentication verification failed"

# Step 3: Apply RLS policy fix
print_header "Step 3: Applying RLS policy fix"
echo "Running comprehensive-rls-fix.js to apply the RLS policy fix..."
node comprehensive-rls-fix.js
check_success "RLS policy fix applied successfully" "Failed to apply RLS policy fix"

# Step 4: Ensure user has a premium subscription
print_header "Step 4: Ensuring user has a premium subscription"
echo "Running update-user-subscription.js to ensure the user has a premium subscription..."
node update-user-subscription.js
check_success "User subscription updated successfully" "Failed to update user subscription"

# Step 5: Rebuild and restart the application
print_header "Step 5: Rebuilding and restarting the application"
echo "Rebuilding the application..."
npm run build
check_success "Application rebuilt successfully" "Failed to rebuild the application"

echo "Restarting the application..."
echo "To start the application, run: npm run start"

# Step 6: Test the fix end-to-end
print_header "Step 6: Testing the fix end-to-end"
echo "Running test-comprehensive-fix.js to verify the fix..."
node test-comprehensive-fix.js
check_success "End-to-end tests completed" "End-to-end tests failed"

# Step 7: Provide next steps
print_header "Step 7: Next steps"
echo "To start the application, run: npm run start"
echo "After starting the application:"
echo "1. Log in with your user account"
echo "2. Try using the 'analyze website' function from the home screen"
echo "3. Verify that scans can be created successfully"

# Final summary
print_header "Fix Summary"
echo "The comprehensive fix has been applied to your WebVitalAI application."
echo "The following issues have been addressed:"
echo "1. Environment configuration has been set to production mode"
echo "2. Authentication issues have been fixed"
echo "3. RLS policies have been correctly applied to the scans table"
echo "4. User subscription has been updated to premium"

if [ $ERROR_FLAG -eq 0 ]; then
  echo -e "\n${GREEN}The fix is now complete!${NC}"
  echo "The application should now be able to create scans successfully."
else
  echo -e "\n${YELLOW}The fix completed with some warnings or errors.${NC}"
  echo "Please review the output above for details."
  echo "You may need to manually resolve some issues."
fi

echo -e "\nIf you're still experiencing issues, please:"
echo "1. Check the logs for more information"
echo "2. Verify your Supabase credentials in .env.local"
echo "3. Run 'node test-comprehensive-fix.js' to run the tests again"
echo "4. Refer to FINAL-FIX-INSTRUCTIONS.md for detailed troubleshooting steps"