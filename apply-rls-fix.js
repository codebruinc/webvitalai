/**
 * Wrapper script to apply RLS policy fixes for metrics and issues tables
 * This script tries multiple methods in order of reliability
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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

console.log(`\n${colors.bold}${colors.cyan}WebVitalAI Metrics & Issues RLS Policy Fix${colors.reset}\n`);

// Check if the SQL file exists
const sqlFilePath = path.join(process.cwd(), 'fix-metrics-issues-rls.sql');
if (!fs.existsSync(sqlFilePath)) {
  console.error(`${colors.red}Error: SQL file not found at ${sqlFilePath}${colors.reset}`);
  process.exit(1);
}

// Check if the fix scripts exist
const cliFixPath = path.join(process.cwd(), 'apply-metrics-issues-cli.cjs');
const directFixPath = path.join(process.cwd(), 'apply-metrics-issues-fix.cjs');
const supabaseFixPath = path.join(process.cwd(), 'apply-metrics-issues-supabase.cjs');
const manualFixPath = path.join(process.cwd(), 'apply-metrics-issues-manual.cjs');

const missingScripts = [];
if (!fs.existsSync(cliFixPath)) missingScripts.push(cliFixPath);
if (!fs.existsSync(directFixPath)) missingScripts.push(directFixPath);
if (!fs.existsSync(supabaseFixPath)) missingScripts.push(supabaseFixPath);
if (!fs.existsSync(manualFixPath)) missingScripts.push(manualFixPath);

if (missingScripts.length > 0) {
  console.error(`${colors.red}Error: The following fix scripts are missing:${colors.reset}`);
  missingScripts.forEach(script => console.error(`- ${script}`));
  process.exit(1);
}

// Function to run a script and return a promise
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}Running ${path.basename(scriptPath)}...${colors.reset}`);
    
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

// Main function to try each method in order
async function applyRLSFixes() {
  console.log(`${colors.bold}Attempting to apply RLS policy fixes using multiple methods...${colors.reset}\n`);
  
  // Method 1: Supabase CLI (preferred method)
  try {
    console.log(`${colors.bold}Method 1: Using Supabase CLI${colors.reset}`);
    await runScript(cliFixPath);
    console.log(`${colors.green}${colors.bold}✓ RLS policy fixes applied successfully using Supabase CLI!${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.yellow}Method 1 failed: ${error.message}${colors.reset}\n`);
  }
  
  // Method 2: Direct PostgreSQL connection
  try {
    console.log(`${colors.bold}Method 2: Using direct PostgreSQL connection${colors.reset}`);
    await runScript(directFixPath);
    console.log(`${colors.green}${colors.bold}✓ RLS policy fixes applied successfully using direct PostgreSQL connection!${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.yellow}Method 2 failed: ${error.message}${colors.reset}\n`);
  }
  
  // Method 3: Supabase JavaScript client
  try {
    console.log(`${colors.bold}Method 3: Using Supabase JavaScript client${colors.reset}`);
    await runScript(supabaseFixPath);
    console.log(`${colors.green}${colors.bold}✓ RLS policy fixes applied successfully using Supabase JavaScript client!${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.yellow}Method 3 failed: ${error.message}${colors.reset}\n`);
  }
  
  // Method 4: Manual instructions
  console.log(`${colors.bold}${colors.yellow}All automatic methods failed. Showing manual instructions:${colors.reset}\n`);
  try {
    await runScript(manualFixPath);
    return false; // Return false because manual intervention is required
  } catch (error) {
    console.error(`${colors.red}Error displaying manual instructions: ${error.message}${colors.reset}`);
    return false;
  }
}

// Run the async function
applyRLSFixes()
  .then((success) => {
    if (success) {
      console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
      console.log(`1. Restart your application: ${colors.cyan}npm run build && npm run start${colors.reset}`);
      console.log(`2. Test the scan functionality again`);
    } else {
      console.log(`\n${colors.bold}${colors.yellow}Please follow the manual instructions above to complete the fix.${colors.reset}`);
    }
  })
  .catch(err => {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, err);
    process.exit(1);
  });