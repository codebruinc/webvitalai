#!/bin/bash

# Script to apply RLS policy fixes for metrics and issues tables
# This script runs the apply-rls-fix.js wrapper script

# ANSI color codes for better readability
RESET="\033[0m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
BOLD="\033[1m"

echo -e "\n${BOLD}${BLUE}WebVitalAI Metrics & Issues RLS Policy Fix${RESET}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${RESET}"
    echo -e "${YELLOW}Please install Node.js from https://nodejs.org/${RESET}"
    exit 1
fi

# Check if the wrapper script exists
if [ ! -f "apply-rls-fix.js" ]; then
    echo -e "${RED}Error: apply-rls-fix.js not found${RESET}"
    echo -e "${YELLOW}Please ensure you are running this script from the project root directory${RESET}"
    exit 1
fi

# Run the wrapper script
echo -e "${BLUE}Running apply-rls-fix.js...${RESET}\n"
node apply-rls-fix.js

# Check if the script was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}✓ Script completed successfully!${RESET}"
else
    echo -e "\n${RED}${BOLD}✗ Script failed. Please check the error messages above.${RESET}"
    exit 1
fi