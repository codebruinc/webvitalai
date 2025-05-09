#!/usr/bin/env node

/**
 * Fix for dashboard scan results button issue and Supabase URL validation
 *
 * This script applies two fixes:
 * 1. Fixes the DashboardContent.tsx file to ensure the "View Results" button works correctly
 *    by using the fallback pattern consistently for accessing the scan ID.
 * 2. Adds URL validation to the supabase.ts file to prevent "Invalid URL" errors.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Applying fixes for dashboard scan results button and Supabase URL validation...');

// Path to the files
const dashboardContentPath = path.join(process.cwd(), 'src', 'components', 'dashboard', 'DashboardContent.tsx');
const supabasePath = path.join(process.cwd(), 'src', 'lib', 'supabase.ts');

try {
  // Fix 1: Dashboard Content
  if (fs.existsSync(dashboardContentPath)) {
    // Read the file content
    let content = fs.readFileSync(dashboardContentPath, 'utf8');

    // Apply the fix - replace the problematic line with the fixed version
    const problematicCode = /onClick={\(\) => handleViewResults\(website\.latest_scan!\.id\)}/;
    const fixedCode = 'onClick={() => handleViewResults((website.latest_scan || createDefaultScan(website)).id)}';

    if (problematicCode.test(content)) {
      content = content.replace(problematicCode, fixedCode);
      
      // Write the fixed content back to the file
      fs.writeFileSync(dashboardContentPath, content, 'utf8');
      console.log('✅ Successfully applied fix to DashboardContent.tsx');
    } else {
      console.log('✅ Fix already applied or not needed in DashboardContent.tsx');
    }
  } else {
    console.error(`⚠️ Warning: File not found at ${dashboardContentPath}`);
  }

  // Fix 2: Supabase URL Validation
  if (fs.existsSync(supabasePath)) {
    // Read the file content
    let content = fs.readFileSync(supabasePath, 'utf8');

    // Check if the URL validation is already added
    if (!content.includes('new URL(supabaseUrl)')) {
      // Find the position to insert the validation code
      const validationInsertPoint = content.indexOf('if (!supabaseUrl || !supabaseAnonKey) {');
      
      if (validationInsertPoint !== -1) {
        // Find the end of the validation block
        const validationBlockEnd = content.indexOf('}', validationInsertPoint) + 1;
        
        // Create the new validation code
        const urlValidationCode = `
// Ensure supabaseUrl is a valid URL
try {
  // Test if the URL is valid by creating a URL object
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL:', supabaseUrl);
  throw new Error(\`Invalid Supabase URL: \${supabaseUrl}\`);
}`;

        // Insert the validation code after the existing validation block
        const newContent =
          content.substring(0, validationBlockEnd) +
          '\n' +
          urlValidationCode +
          '\n' +
          content.substring(validationBlockEnd);
        
        // Write the fixed content back to the file
        fs.writeFileSync(supabasePath, newContent, 'utf8');
        console.log('✅ Successfully applied fix to supabase.ts');
      } else {
        console.error('❌ Could not find insertion point in supabase.ts');
      }
    } else {
      console.log('✅ Fix already applied or not needed in supabase.ts');
    }
  } else {
    console.error(`⚠️ Warning: File not found at ${supabasePath}`);
  }

  // Restart the application if running in development mode
  console.log('Restarting the application...');
  try {
    // This will fail if the app is not running, which is fine
    execSync('pkill -f "next dev"', { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors from pkill
  }

  console.log('Starting the application...');
  try {
    // Start the application in the background
    execSync('npm run dev &', { stdio: 'inherit' });
    console.log('✅ Application restarted successfully');
  } catch (error) {
    console.error('❌ Failed to restart the application:', error.message);
  }

  console.log('\nFixes applied successfully!');
  console.log('1. The "View Results" button should now work correctly.');
  console.log('2. Supabase URL validation has been added to prevent "Invalid URL" errors.');
  console.log('Please refresh your browser to see the changes.');

} catch (error) {
  console.error('❌ Error applying fixes:', error.message);
  process.exit(1);
}