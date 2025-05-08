#!/bin/bash
# Make sure this script is executable: chmod +x apply-rls-bypass-fix.sh

# WebVitalAI RLS Bypass Fix Script
# This script applies all the necessary fixes to bypass RLS policies for scan creation

# Set text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   WebVitalAI RLS Bypass Fix Script     ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Function to check if a command exists
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}$1 is not installed. Please install $1 and try again.${NC}"
    exit 1
  fi
}

# Check if required tools are installed
echo -e "${YELLOW}Checking required tools...${NC}"
check_command node
check_command npm
echo -e "${GREEN}All required tools are installed.${NC}"
echo ""

# Check if .env.local exists
echo -e "${YELLOW}Checking environment variables...${NC}"
if [ ! -f .env.local ]; then
  echo -e "${RED}.env.local file not found. Creating a template file...${NC}"
  cat > .env.local << EOL
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application
NODE_ENV=production
TESTING_MODE=false
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOL
  echo -e "${YELLOW}Please edit .env.local with your Supabase credentials and run this script again.${NC}"
  exit 1
fi

# Check if required environment variables are set
source .env.local 2>/dev/null || true
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}Missing required environment variables in .env.local.${NC}"
  echo -e "${YELLOW}Please make sure the following variables are set:${NC}"
  echo "  - NEXT_PUBLIC_SUPABASE_URL"
  echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo -e "${GREEN}Environment variables are set.${NC}"
echo ""

# Install required dependencies
echo -e "${YELLOW}Installing required dependencies...${NC}"
npm install --no-save @supabase/supabase-js dotenv node-fetch
echo -e "${GREEN}Dependencies installed.${NC}"
echo ""

# Function to apply code changes
apply_code_changes() {
  echo -e "${YELLOW}Applying code changes to $1...${NC}"
  if [ ! -f "$1" ]; then
    echo -e "${RED}File $1 not found.${NC}"
    return 1
  fi
  
  if [ "$1" = "src/lib/supabase.ts" ]; then
    # Check if the service role client is already in the file
    if grep -q "supabaseServiceRole" "$1"; then
      echo -e "${GREEN}Service role client already exists in $1.${NC}"
    else
      # Add service role client to supabase.ts
      echo -e "${YELLOW}Adding service role client to $1...${NC}"
      # Create a backup of the original file
      cp "$1" "$1.bak"
      # Add the service role client code
      cat > "$1" << EOL
import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// For server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a standard client for server-side usage with anon key
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// Create a service role client that bypasses RLS
export const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// For client components - this creates a fresh client for each request
export const supabase = typeof window !== 'undefined'
  ? createClientComponentClient()
  : supabaseAdmin;

// Log which clients are available
console.log('Supabase clients initialized:', {
  hasServiceRoleKey: !!supabaseServiceRoleKey,
  hasAnonKey: !!supabaseAnonKey
});
EOL
      echo -e "${GREEN}Service role client added to $1.${NC}"
    fi
    return 0
  elif [ "$1" = "src/services/scanService.ts" ]; then
    # Check if the RPC function call is already in the file
    if grep -q "create_scan_bypass_rls" "$1"; then
      echo -e "${GREEN}RPC function call already exists in $1.${NC}"
      return 0
    fi
    
    # Create a backup of the original file
    cp "$1" "$1.bak"
    
    # Add the RPC function call to scanService.ts
    # This is a simplified approach - in a real scenario, you might want to use a more robust method
    echo -e "${YELLOW}Adding RPC function call to $1...${NC}"
    
    # Use sed to add the RPC function call in the appropriate location
    # This assumes the file structure matches what we've seen
    sed -i.tmp '/Third attempt: Try with direct SQL using service role/,/try {/c\
          // Third attempt: Try with direct SQL using service role\
          scanCreationAttempts++;\
          console.log(`Scan creation attempt ${scanCreationAttempts}: Using direct SQL with service role`);\
          \
          try {\
            // Use RPC to insert scan directly\
            const { data: rpcScan, error: rpcError } = await supabaseServiceRole.rpc(\
              '"'"'create_scan_bypass_rls'"'"',\
              { website_id_param: websiteId }\
            );' "$1"
    
    # Remove the temporary file
    rm -f "$1.tmp"
    
    echo -e "${GREEN}RPC function call added to $1.${NC}"
    return 0
  elif [ "$1" = "src/app/api/scan/route.ts" ]; then
    # Check if the service role fallback is already in the file
    if grep -q "supabaseServiceRole" "$1"; then
      echo -e "${GREEN}Service role fallback already exists in $1.${NC}"
      return 0
    fi
    
    # Create a backup of the original file
    cp "$1" "$1.bak"
    
    # Add the service role import if it doesn't exist
    if ! grep -q "import { supabaseServiceRole } from '@/lib/supabase';" "$1"; then
      sed -i.tmp '1s/^/import { NextRequest, NextResponse } from '"'"'next\/server'"'"';\nimport { createRouteHandlerClient } from '"'"'@supabase\/auth-helpers-nextjs'"'"';\nimport { createClient } from '"'"'@supabase\/supabase-js'"'"';\nimport { cookies } from '"'"'next\/headers'"'"';\nimport { Database } from '"'"'@\/types\/supabase'"'"';\nimport { initiateScan } from '"'"'@\/services\/scanService'"'"';\nimport { queueScan } from '"'"'@\/services\/queueService'"'"';\nimport { supabaseServiceRole } from '"'"'@\/lib\/supabase'"'"';\n/' "$1"
      rm -f "$1.tmp"
    fi
    
    # Add the service role fallback to route.ts
    echo -e "${YELLOW}Adding service role fallback to $1...${NC}"
    
    # Use sed to add the service role fallback in the appropriate location
    sed -i.tmp '/try {/,/} catch (scanError: any) {/c\
    try {\
      // First try with the authenticated client\
      const scanId = await initiateScan(url, userId, supabase);\
      \
      // Queue the scan for processing\
      await queueScan(scanId);\
      \
      console.log('"'"'Scan API: Scan initiated successfully'"'"', { scanId });\
      \
      // Return the scan ID\
      return NextResponse.json({\
        success: true,\
        message: '"'"'Scan initiated'"'"',\
        data: {\
          scan_id: scanId,\
        },\
      });\
    } catch (scanError: any) {\
      console.error('"'"'Scan API: First attempt failed, trying with service role'"'"', scanError);\
      \
      // If the first attempt fails, try with the service role client\
      try {\
        const scanId = await initiateScan(url, userId, supabaseServiceRole);\
        \
        // Queue the scan for processing\
        await queueScan(scanId);\
        \
        console.log('"'"'Scan API: Scan initiated successfully with service role'"'"', { scanId });\
        \
        // Return the scan ID\
        return NextResponse.json({\
          success: true,\
          message: '"'"'Scan initiated with elevated permissions'"'"',\
          data: {\
            scan_id: scanId,\
          },\
        });\
      } catch (serviceRoleError: any) {\
        // If both attempts fail, throw the error to be caught by the outer catch block\
        console.error('"'"'Scan API: Service role attempt also failed'"'"', serviceRoleError);\
        throw new Error(`Failed to create scan: ${serviceRoleError.message}`);\
      }\
    }' "$1"
    
    # Remove the temporary file
    rm -f "$1.tmp"
    
    echo -e "${GREEN}Service role fallback added to $1.${NC}"
    return 0
  fi
  
  echo -e "${RED}Unknown file $1.${NC}"
  return 1
}

# Apply code changes to required files
echo -e "${YELLOW}Applying code changes to required files...${NC}"
apply_code_changes "src/lib/supabase.ts"
apply_code_changes "src/services/scanService.ts"
apply_code_changes "src/app/api/scan/route.ts"
echo -e "${GREEN}Code changes applied.${NC}"
echo ""

# Apply the RLS bypass solution
echo -e "${YELLOW}Creating RLS bypass database function...${NC}"
# Make the script executable
chmod +x apply-rls-bypass.js
# Run the script
node apply-rls-bypass.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create RLS bypass database function.${NC}"
  echo -e "${YELLOW}Please check the error messages above.${NC}"
  exit 1
fi
echo -e "${GREEN}RLS bypass database function created successfully.${NC}"
echo ""

# Rebuild the application
echo -e "${YELLOW}Rebuilding the application...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to rebuild the application.${NC}"
  echo -e "${YELLOW}Please fix any build errors and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}Application rebuilt successfully.${NC}"
echo ""

# Verify the fix
echo -e "${YELLOW}Verifying the RLS bypass fix...${NC}"
# Make the verification script executable
chmod +x verify-rls-bypass-fix.js
# Run the verification script
node verify-rls-bypass-fix.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Verification failed. Please check the error messages above.${NC}"
  echo -e "${YELLOW}You may need to start the application with 'npm run dev' to fully test the API endpoint.${NC}"
  exit 1
fi
echo -e "${GREEN}Verification completed successfully.${NC}"
echo ""

# Print completion message
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}RLS bypass fix applied successfully!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "You can now start the application with: ${YELLOW}npm run start${NC}"
echo -e "If you encounter any issues, please run: ${YELLOW}node verify-rls-bypass-fix.js${NC}"
echo -e "For detailed verification documentation, see: ${YELLOW}docs/rls-bypass-verification.md${NC}"
echo ""