/**
 * Script to provide manual instructions for applying RLS policy fixes
 * This script displays the SQL commands that need to be executed in the Supabase dashboard
 */

const fs = require('fs');
const path = require('path');

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

console.log(`\n${colors.bold}${colors.cyan}WebVitalAI Metrics & Issues RLS Policy Manual Fix Instructions${colors.reset}\n`);

// Check if the SQL file exists
const sqlFilePath = path.join(process.cwd(), 'fix-metrics-issues-rls.sql');
if (!fs.existsSync(sqlFilePath)) {
  console.error(`${colors.red}Error: SQL file not found at ${sqlFilePath}${colors.reset}`);
  process.exit(1);
}

// Get Supabase URL from environment
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// If not available in environment, try to read from .env.local
if (!supabaseUrl) {
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
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error reading .env.local file:${colors.reset}`, error);
  }
}

// Extract the project reference from the Supabase URL if available
let projectRef = null;
if (supabaseUrl) {
  projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
}

// Read the SQL file
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log(`${colors.bold}${colors.yellow}Manual Instructions for Applying RLS Policy Fixes${colors.reset}\n`);
console.log(`${colors.bold}Step 1:${colors.reset} Log in to your Supabase dashboard`);

if (projectRef) {
  console.log(`${colors.bold}Step 2:${colors.reset} Go to the SQL Editor for your project: ${colors.cyan}https://app.supabase.com/project/${projectRef}/sql${colors.reset}`);
} else {
  console.log(`${colors.bold}Step 2:${colors.reset} Go to the SQL Editor for your project in the Supabase dashboard`);
}

console.log(`${colors.bold}Step 3:${colors.reset} Create a new SQL query and paste the following SQL code:\n`);
console.log(`${colors.cyan}${'-'.repeat(80)}${colors.reset}`);
console.log(`${colors.white}${sqlContent}${colors.reset}`);
console.log(`${colors.cyan}${'-'.repeat(80)}${colors.reset}\n`);

console.log(`${colors.bold}Step 4:${colors.reset} Click the "Run" button to execute the SQL code`);
console.log(`${colors.bold}Step 5:${colors.reset} Verify that the SQL executed successfully without errors`);

console.log(`\n${colors.bold}${colors.green}After applying the fixes:${colors.reset}`);
console.log(`1. Restart your application: ${colors.cyan}npm run build && npm run start${colors.reset}`);
console.log(`2. Test the scan functionality again\n`);

console.log(`${colors.bold}${colors.blue}What this SQL does:${colors.reset}`);
console.log(`1. Enables Row Level Security (RLS) on the metrics and issues tables if not already enabled`);
console.log(`2. Drops any existing RLS policies for these tables to avoid conflicts`);
console.log(`3. Creates new RLS policies that allow:`);
console.log(`   - Users to view, insert, update, and delete their own metrics and issues`);
console.log(`   - Service role to manage all metrics and issues`);
console.log(`4. Verifies that the policies were created successfully\n`);

console.log(`${colors.bold}${colors.yellow}Note:${colors.reset} If you encounter any issues, please check the Supabase logs for more details.`);