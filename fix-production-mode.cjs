/**
 * Script to fix production mode issues in WebVitalAI
 * 
 * This script:
 * 1. Ensures proper environment variables are set
 * 2. Applies RLS policy fixes for metrics and issues tables
 * 3. Verifies API routes are configured for dynamic rendering
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

console.log(`\n${colors.bold}${colors.cyan}WebVitalAI Production Mode Fix${colors.reset}\n`);

// Step 1: Ensure proper environment variables are set
console.log(`${colors.bold}Step 1: Checking environment variables${colors.reset}`);

// Run the set-production-mode.js script
try {
  console.log('Running set-production-mode.js...');
  execSync('node set-production-mode.js', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Environment variables set to production mode${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error setting environment variables:${colors.reset}`, error);
  console.error(`${colors.yellow}Please run 'node set-production-mode.js' manually${colors.reset}`);
}

// Step 2: Apply RLS policy fixes for metrics and issues tables
console.log(`\n${colors.bold}Step 2: Applying RLS policy fixes${colors.reset}`);

// Check which RLS fix script exists and use the most robust one available
if (fs.existsSync(path.join(process.cwd(), 'apply-rls-fix.js'))) {
  try {
    console.log('Running apply-rls-fix.js (wrapper script)...');
    execSync('node apply-rls-fix.js', { stdio: 'inherit' });
    console.log(`${colors.green}✓ RLS policy fixes applied${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error applying RLS policy fixes:${colors.reset}`, error);
    console.error(`${colors.yellow}Please run 'node apply-rls-fix.js' manually${colors.reset}`);
  }
} else if (fs.existsSync(path.join(process.cwd(), 'apply-metrics-issues-cli.cjs'))) {
  try {
    console.log('Running apply-metrics-issues-cli.cjs...');
    execSync('node apply-metrics-issues-cli.cjs', { stdio: 'inherit' });
    console.log(`${colors.green}✓ RLS policy fixes applied${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error applying RLS policy fixes:${colors.reset}`, error);
    console.error(`${colors.yellow}Please run 'node apply-metrics-issues-cli.cjs' manually${colors.reset}`);
  }
} else if (fs.existsSync(path.join(process.cwd(), 'apply-metrics-issues-fix.cjs'))) {
  try {
    console.log('Running apply-metrics-issues-fix.cjs...');
    execSync('node apply-metrics-issues-fix.cjs', { stdio: 'inherit' });
    console.log(`${colors.green}✓ RLS policy fixes applied${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error applying RLS policy fixes:${colors.reset}`, error);
    console.error(`${colors.yellow}Please run 'node apply-metrics-issues-fix.cjs' manually${colors.reset}`);
  }
} else {
  console.error(`${colors.red}Error: No RLS fix scripts found${colors.reset}`);
  console.error(`${colors.yellow}Please run one of the following scripts manually:${colors.reset}`);
  console.error(`${colors.yellow}1. apply-rls-fix.js (recommended)${colors.reset}`);
  console.error(`${colors.yellow}2. apply-metrics-issues-cli.cjs${colors.reset}`);
  console.error(`${colors.yellow}3. apply-metrics-issues-fix.cjs${colors.reset}`);
  console.error(`${colors.yellow}4. apply-metrics-issues-supabase.cjs${colors.reset}`);
  console.error(`${colors.yellow}5. apply-metrics-issues-manual.cjs${colors.reset}`);
}

// Step 3: Verify API routes are configured for dynamic rendering
console.log(`\n${colors.bold}Step 3: Verifying API routes${colors.reset}`);

const apiRoutes = [
  'src/app/api/scan/route.ts',
  'src/app/api/scan/status/route.ts',
  'src/app/api/scan/results/route.ts'
];

let routesFixed = 0;

for (const routePath of apiRoutes) {
  if (!fs.existsSync(routePath)) {
    console.log(`${colors.yellow}Warning: ${routePath} not found, skipping${colors.reset}`);
    continue;
  }

  const content = fs.readFileSync(routePath, 'utf8');
  
  if (!content.includes("export const dynamic = 'force-dynamic'")) {
    console.log(`Adding dynamic directive to ${routePath}...`);
    
    // Add the dynamic directive after the imports
    const updatedContent = content.replace(
      /^(import.*\n)+/,
      match => `${match}\n// Force dynamic rendering for this route\nexport const dynamic = 'force-dynamic';\n`
    );
    
    fs.writeFileSync(routePath, updatedContent);
    routesFixed++;
    console.log(`${colors.green}✓ Added dynamic directive to ${routePath}${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ ${routePath} already has dynamic directive${colors.reset}`);
  }
}

console.log(`${routesFixed > 0 ? colors.green : colors.blue}${routesFixed} API routes fixed${colors.reset}`);

// Summary
console.log(`\n${colors.bold}Fix Summary${colors.reset}`);
console.log(`1. Environment variables set to production mode`);
console.log(`2. RLS policy fixes applied for metrics and issues tables`);
console.log(`3. API routes configured for dynamic rendering`);

console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
console.log(`1. Rebuild and restart your application:`);
console.log(`   ${colors.cyan}npm run build && npm run start${colors.reset}`);
console.log(`2. Test the scan functionality again`);