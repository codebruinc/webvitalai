#!/bin/bash

# WebVitalAI Comprehensive Fix Script
# This script fixes all potential issues with WebVitalAI

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}WebVitalAI Comprehensive Fix Script${NC}"
echo "This script will fix all potential issues with WebVitalAI."
echo "-------------------------------------------------------------"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js before running this script."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    echo "Please install npm before running this script."
    exit 1
fi

# Step 1: Install required dependencies
echo -e "\n${YELLOW}Step 1: Installing required dependencies...${NC}"
npm install @supabase/supabase-js dotenv

# Step 2: Run the comprehensive fix
echo -e "\n${YELLOW}Step 2: Applying comprehensive fix...${NC}"
node fix-all.js

# Step 3: Provide final instructions
echo -e "\n${GREEN}Fix has been applied!${NC}"
echo -e "\n${YELLOW}Final Steps:${NC}"
echo "1. Restart your application:"
echo "   npm run build && npm run start"
echo "2. Log in with your user account"
echo "3. Try using the 'analyze website' function from the home screen"
echo "4. Verify that scans can be created successfully"
echo -e "\n${YELLOW}If you still encounter issues:${NC}"
echo "1. Run the diagnostic script to get more information:"
echo "   ./diagnose-rls-issue.sh"
echo "2. Check the RLS-FIX-README.md file for more troubleshooting tips"
echo -e "\n${GREEN}Good luck!${NC}"