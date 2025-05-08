#!/bin/bash

# WebVitalAI Comprehensive RLS Policy Fix Script
# This script fixes the row-level security policy issue for the scans table

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}WebVitalAI Comprehensive RLS Policy Fix Script${NC}"
echo "This script will fix the row-level security policy issue for the scans table."
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

# Step 2: Make the script executable
echo -e "\n${YELLOW}Step 2: Making the script executable...${NC}"
chmod +x fix-rls-complete.js

# Step 3: Apply the comprehensive RLS policy fix
echo -e "\n${YELLOW}Step 3: Applying comprehensive RLS policy fix...${NC}"
node fix-rls-complete.js

# Step 4: Provide final instructions
echo -e "\n${GREEN}RLS policy fix has been applied!${NC}"
echo -e "\n${YELLOW}Final Steps:${NC}"
echo "1. Restart your application:"
echo "   npm run build && npm run start"
echo "2. Log in with your user account"
echo "3. Try using the 'analyze website' function from the home screen"
echo "4. Verify that scans can be created successfully"
echo -e "\n${GREEN}Good luck!${NC}"