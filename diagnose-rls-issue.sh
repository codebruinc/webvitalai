#!/bin/bash

# WebVitalAI RLS Policy Diagnostic Script
# This script helps diagnose row-level security policy issues for the scans table

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}WebVitalAI RLS Policy Diagnostic Tool${NC}"
echo "This script will help diagnose the row-level security policy issue for the scans table."
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

# Step 2: Run the diagnostic tool
echo -e "\n${YELLOW}Step 2: Running diagnostic tool...${NC}"
node diagnose-rls-issue.js

# Step 3: Provide next steps
echo -e "\n${GREEN}Diagnostic complete!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Review the diagnostic results above"
echo "2. If RLS policy issues were detected, run the fix script:"
echo "   ./fix-rls-complete.sh"
echo "3. If you prefer to fix the issue manually, run the SQL script in the Supabase dashboard:"
echo "   direct-rls-fix.sql"
echo -e "\n${GREEN}Good luck!${NC}"