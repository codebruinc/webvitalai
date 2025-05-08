#!/bin/bash

# WebVitalAI RLS Policy Fix Script
# This script fixes the row-level security policy issue for the scans table

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}WebVitalAI RLS Policy Fix Script${NC}"
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

# Step 2: Apply the RLS policy fix
echo -e "\n${YELLOW}Step 2: Applying RLS policy fix...${NC}"
node apply-rls-fix.js

# Step 3: Provide final instructions
echo -e "\n${GREEN}RLS policy fix has been applied!${NC}"
echo -e "\n${YELLOW}Final Steps:${NC}"
echo "1. Restart your application:"
echo "   npm run build && npm run start"
echo "2. Log in with your user account"
echo "3. Try using the 'analyze website' function from the home screen"
echo "4. Verify that scans can be created successfully"
echo -e "\n${YELLOW}If you still encounter issues:${NC}"
echo "- You can run the SQL script directly in the Supabase dashboard:"
echo "  1. Log in to your Supabase dashboard"
echo "  2. Go to the SQL Editor"
echo "  3. Copy and paste the contents of fix-rls-policy.sql"
echo "  4. Run the SQL script"
echo -e "\n${GREEN}Good luck!${NC}"