/**
 * Script to apply RLS policy fixes for metrics and issues tables
 * This script uses the Supabase CLI to execute SQL commands
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

console.log(`\n${colors.bold}${colors.cyan}WebVitalAI Metrics & Issues RLS Policy Fix (Supabase CLI)${colors.reset}\n`);

// Check if the SQL file exists
const sqlFilePath = path.join(process.cwd(), 'fix-metrics-issues-rls.sql');
if (!fs.existsSync(sqlFilePath)) {
  console.error(`${colors.red}Error: SQL file not found at ${sqlFilePath}${colors.reset}`);
  process.exit(1);
}

// Get Supabase URL and service role key from environment
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If not available in environment, try to read from .env.local
if (!supabaseUrl || !supabaseServiceRoleKey) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        if (line.trim().startsWith('#') || line.trim() === '') continue;
        
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          
          if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
          if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceRoleKey = value;
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error reading .env.local file:${colors.reset}`, error);
  }
}

// Check if we have the required Supabase credentials
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(`${colors.red}Error: Supabase URL and service role key are required${colors.reset}`);
  console.error(`${colors.yellow}Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables${colors.reset}`);
  process.exit(1);
}

// Extract the project reference from the Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error(`${colors.red}Error: Could not extract project reference from Supabase URL${colors.reset}`);
  process.exit(1);
}

// Function to check if a command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check Supabase CLI version
function getSupabaseCliVersion() {
  try {
    const versionOutput = execSync('supabase --version', { encoding: 'utf8' }).trim();
    const versionMatch = versionOutput.match(/supabase\/(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : null;
  } catch (error) {
    return null;
  }
}

// Function to compare versions
function compareVersions(v1, v2) {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

// Install or update Supabase CLI
function ensureSupabaseCli() {
  console.log(`${colors.blue}Checking Supabase CLI installation...${colors.reset}`);
  
  const minVersion = '1.50.0'; // Minimum version that supports the sql command
  const currentVersion = getSupabaseCliVersion();
  
  if (!currentVersion) {
    console.log(`${colors.yellow}Supabase CLI not found. Installing...${colors.reset}`);
    
    try {
      // Try npm installation first
      execSync('npm install -g supabase', { stdio: 'inherit' });
      console.log(`${colors.green}Supabase CLI installed successfully via npm${colors.reset}`);
      return true;
    } catch (npmError) {
      console.log(`${colors.yellow}Failed to install via npm. Trying alternative methods...${colors.reset}`);
      
      // Check if we're on macOS and have Homebrew
      if (commandExists('brew')) {
        try {
          execSync('brew install supabase/tap/supabase', { stdio: 'inherit' });
          console.log(`${colors.green}Supabase CLI installed successfully via Homebrew${colors.reset}`);
          return true;
        } catch (brewError) {
          console.error(`${colors.red}Failed to install via Homebrew${colors.reset}`);
        }
      }
      
      // Check if we're on Windows and have Scoop
      if (commandExists('scoop')) {
        try {
          execSync('scoop bucket add supabase https://github.com/supabase/scoop-bucket.git', { stdio: 'ignore' });
          execSync('scoop install supabase', { stdio: 'inherit' });
          console.log(`${colors.green}Supabase CLI installed successfully via Scoop${colors.reset}`);
          return true;
        } catch (scoopError) {
          console.error(`${colors.red}Failed to install via Scoop${colors.reset}`);
        }
      }
      
      console.error(`${colors.red}Failed to install Supabase CLI automatically.${colors.reset}`);
      console.error(`${colors.yellow}Please install it manually:${colors.reset}`);
      console.error(`- npm: npm install -g supabase`);
      console.error(`- macOS: brew install supabase/tap/supabase`);
      console.error(`- Windows: scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`);
      console.error(`- Linux: curl -s https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash`);
      
      return false;
    }
  } else {
    console.log(`${colors.blue}Supabase CLI version ${currentVersion} found${colors.reset}`);
    
    if (compareVersions(currentVersion, minVersion) < 0) {
      console.log(`${colors.yellow}Updating Supabase CLI (current: ${currentVersion}, required: ${minVersion})...${colors.reset}`);
      
      try {
        execSync('npm update -g supabase', { stdio: 'inherit' });
        const newVersion = getSupabaseCliVersion();
        console.log(`${colors.green}Supabase CLI updated to version ${newVersion}${colors.reset}`);
        return true;
      } catch (updateError) {
        console.error(`${colors.red}Failed to update Supabase CLI${colors.reset}`);
        console.error(`${colors.yellow}Please update it manually:${colors.reset}`);
        console.error(`- npm: npm update -g supabase`);
        console.error(`- macOS: brew upgrade supabase`);
        console.error(`- Windows: scoop update supabase`);
        
        return false;
      }
    }
    
    return true;
  }
}

// Check if the sql command is available
function checkSqlCommand() {
  try {
    execSync('supabase sql --help', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main function
function applyRLSFixes() {
  // Ensure Supabase CLI is installed
  if (!ensureSupabaseCli()) {
    console.error(`${colors.red}Cannot proceed without Supabase CLI${colors.reset}`);
    process.exit(1);
  }
  
  // Check if the sql command is available
  if (!checkSqlCommand()) {
    console.error(`${colors.red}The 'sql' command is not available in your Supabase CLI installation${colors.reset}`);
    console.error(`${colors.yellow}Please ensure you have the latest version of the Supabase CLI${colors.reset}`);
    process.exit(1);
  }
  
  // Create a temporary file with the SQL content
  const tempFilePath = path.join(process.cwd(), 'temp-fix-metrics-issues.sql');
  fs.writeFileSync(tempFilePath, fs.readFileSync(sqlFilePath, 'utf8'));
  
  try {
    console.log(`${colors.blue}Applying RLS policy fixes for metrics and issues tables...${colors.reset}`);
    
    // Use the Supabase CLI to execute the SQL file
    const command = `supabase sql --db-url postgresql://postgres:${supabaseServiceRoleKey}@db.${projectRef}.supabase.co:5432/postgres -f ${tempFilePath}`;
    
    try {
      execSync(command, { stdio: 'inherit' });
      console.log(`\n${colors.green}${colors.bold}✓ RLS policy fixes applied successfully!${colors.reset}`);
    } catch (error) {
      console.error(`\n${colors.red}Error executing SQL:${colors.reset}`, error.message);
      
      // Try alternative command format if the first one fails
      console.log(`${colors.yellow}Trying alternative command format...${colors.reset}`);
      
      try {
        const altCommand = `supabase db execute --file ${tempFilePath} --project-ref ${projectRef} --password ${supabaseServiceRoleKey}`;
        execSync(altCommand, { stdio: 'inherit' });
        console.log(`\n${colors.green}${colors.bold}✓ RLS policy fixes applied successfully with alternative command!${colors.reset}`);
      } catch (altError) {
        console.error(`\n${colors.red}Error with alternative command:${colors.reset}`, altError.message);
        console.error(`\n${colors.yellow}Alternative method: You can manually apply the SQL fixes by:${colors.reset}`);
        console.error(`1. Go to the Supabase dashboard: https://app.supabase.com/project/${projectRef}/sql`);
        console.error(`2. Copy the contents of fix-metrics-issues-rls.sql`);
        console.error(`3. Paste and execute the SQL in the Supabase SQL editor`);
        process.exit(1);
      }
    }
  } finally {
    // Clean up the temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

// Run the function
try {
  applyRLSFixes();
  
  console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
  console.log(`1. Restart your application: ${colors.cyan}npm run build && npm run start${colors.reset}`);
  console.log(`2. Test the scan functionality again`);
} catch (error) {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
}