#!/usr/bin/env node

/**
 * Fix script for the scan ID format issue in the dashboard
 * This script fixes the "View Results" button that was incorrectly appending "default" to the URL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Applying scan ID format fix...');

// Path to the file we need to modify
const dashboardContentPath = path.join(process.cwd(), 'src/components/dashboard/DashboardContent.tsx');

// Check if the file exists
if (!fs.existsSync(dashboardContentPath)) {
  console.error(`❌ File not found: ${dashboardContentPath}`);
  process.exit(1);
}

// Read the current content
let dashboardContent = fs.readFileSync(dashboardContentPath, 'utf8');

// Check if the fix is already applied
const fixPattern = /const scanId = website\.latest_scan \? website\.latest_scan\.id : null;/;
if (fixPattern.test(dashboardContent)) {
  console.log('✅ Fix already applied to DashboardContent.tsx');
} else {
  // Pattern to find the problematic code
  const problemPattern = /onClick={\(\) => handleViewResults\(\(website\.latest_scan \|\| createDefaultScan\(website\)\)\.id\)}/;
  
  // Replacement code
  const replacement = `onClick={() => {
          // Only use the actual scan ID from the database, not the default one
          const scanId = website.latest_scan ? website.latest_scan.id : null;
          if (scanId) {
            handleViewResults(scanId);
          } else {
            console.warn('No valid scan ID found for website:', website.url);
          }
        }}`;
  
  // Apply the fix
  if (problemPattern.test(dashboardContent)) {
    dashboardContent = dashboardContent.replace(problemPattern, replacement);
    fs.writeFileSync(dashboardContentPath, dashboardContent);
    console.log('✅ Applied fix to DashboardContent.tsx');
  } else {
    // Try a more flexible approach if the exact pattern isn't found
    const buttonSection = dashboardContent.match(/onClick={\(\) => handleViewResults\(.*?website\.latest_scan.*?id\)}/);
    if (buttonSection) {
      dashboardContent = dashboardContent.replace(buttonSection[0], replacement);
      fs.writeFileSync(dashboardContentPath, dashboardContent);
      console.log('✅ Applied fix to DashboardContent.tsx (using flexible pattern matching)');
    } else {
      console.error('❌ Could not find the pattern to replace in DashboardContent.tsx');
      console.error('Please apply the fix manually:');
      console.error('1. Open src/components/dashboard/DashboardContent.tsx');
      console.error('2. Find the "View Results" button onClick handler');
      console.error('3. Replace it with the following code:');
      console.error(replacement);
      process.exit(1);
    }
  }
}

// Create documentation for the fix
const docPath = path.join(process.cwd(), 'docs/scan-id-format-fix.md');
const docContent = `# Scan ID Format Fix

## Issue
On the dashboard, the "View Results" button was appending "default" to the URL string for scans that were recently completed and saved in the database. This was happening because the code was using a fallback pattern that could trigger even for valid scans.

## Root Cause
The issue was in the \`DashboardContent.tsx\` file where the "View Results" button's onClick handler was using a fallback pattern:

\`\`\`tsx
onClick={() => handleViewResults((website.latest_scan || createDefaultScan(website)).id)}
\`\`\`

This would use the default scan ID (which includes "default-" prefix) even when a real scan existed but wasn't properly detected.

## Fix
The fix modifies the onClick handler to explicitly check for the existence of a real scan ID and only use that:

\`\`\`tsx
onClick={() => {
  // Only use the actual scan ID from the database, not the default one
  const scanId = website.latest_scan ? website.latest_scan.id : null;
  if (scanId) {
    handleViewResults(scanId);
  } else {
    console.warn('No valid scan ID found for website:', website.url);
  }
}}
\`\`\`

This ensures that:
1. Only real scan IDs from the database are used
2. The "default-" prefix is never appended to URLs for completed scans
3. A warning is logged if no valid scan ID is found

## Implementation
The fix was implemented by modifying the \`src/components/dashboard/DashboardContent.tsx\` file to change the onClick handler for the "View Results" button.

## Verification
To verify the fix:
1. Run the application
2. Complete a scan for a website
3. Go to the dashboard
4. Click the "View Results" button
5. Check that the URL does not contain "default" but instead has the correct UUID

## Related Files
- \`src/components/dashboard/DashboardContent.tsx\` - Modified to fix the View Results button
- \`scripts/fix-scan-id-format.cjs\` - Script to apply the fix
- \`scripts/test-scan-id-format-fix.cjs\` - Script to test the fix
- \`docs/scan-id-format-fix.md\` - This documentation file
`;

// Create the docs directory if it doesn't exist
const docsDir = path.join(process.cwd(), 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

fs.writeFileSync(docPath, docContent);
console.log(`✅ Created documentation at ${docPath}`);

// Create a summary file
const summaryPath = path.join(process.cwd(), 'SCAN-ID-FORMAT-FIX-SUMMARY.md');
const summaryContent = `# Scan ID Format Fix Summary

## Issue
On the dashboard, the "View Results" button was appending "default" to the URL string for scans that were recently completed and saved in the database.

## Fix
The fix ensures that only real scan IDs from the database are used, and the "default-" prefix is never appended to URLs for completed scans.

## Implementation
- Modified \`src/components/dashboard/DashboardContent.tsx\` to fix the View Results button
- Created \`scripts/fix-scan-id-format.cjs\` to apply the fix
- Created \`scripts/test-scan-id-format-fix.cjs\` to test the fix
- Added documentation in \`docs/scan-id-format-fix.md\`

## Verification
To verify the fix:
1. Run the application
2. Complete a scan for a website
3. Go to the dashboard
4. Click the "View Results" button
5. Check that the URL does not contain "default" but instead has the correct UUID

For detailed information, see \`docs/scan-id-format-fix.md\`.
`;

fs.writeFileSync(summaryPath, summaryContent);
console.log(`✅ Created summary at ${summaryPath}`);

// Check if we need to restart the application
try {
  const isDevRunning = execSync('ps aux | grep "next dev" | grep -v grep').toString().trim() !== '';
  if (isDevRunning) {
    console.log('Development server is running. You may need to restart it for changes to take effect.');
    console.log('To restart the development server:');
    console.log('1. Stop the current server (Ctrl+C)');
    console.log('2. Run "npm run dev" again');
  }
} catch (error) {
  // No dev server running, that's fine
}

console.log('');
console.log('✅ Scan ID format fix applied successfully');
console.log('');
console.log('To verify the fix in the application:');
console.log('1. Run the application');
console.log('2. Complete a scan for a website');
console.log('3. Go to the dashboard');
console.log('4. Click the "View Results" button');
console.log('5. Check that the URL does not contain "default" but instead has the correct UUID');