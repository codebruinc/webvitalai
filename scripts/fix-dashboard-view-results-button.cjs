#!/usr/bin/env node

/**
 * Fix script for the dashboard "View Results" button
 * This script fixes the "View Results" button that was not working
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Applying dashboard "View Results" button fix...');

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
const fixPattern = /window\.location\.href = fullUrl/;
if (fixPattern.test(dashboardContent)) {
  console.log('✅ Fix already applied to DashboardContent.tsx');
} else {
  // Pattern to find the problematic code
  const problemPattern = /const handleViewResults = \(scanId: string\) => \{\s*(?:console\.log\([^)]*\);\s*)?router\.push\(`\/dashboard\?scan=\${(?:encodeURIComponent\()?scanId(?:\))?\}`\);\s*\};/;
  
  // Replacement code
  const replacement = `const handleViewResults = (scanId: string) => {
    console.log('handleViewResults called with scanId:', scanId);
    
    // Try different router navigation methods
    try {
      console.log('Using router.push with full URL');
      // Use the full URL to ensure proper navigation
      const fullUrl = \`/dashboard?scan=\${encodeURIComponent(scanId)}\`;
      console.log('Navigating to:', fullUrl);
      
      // Force a hard navigation to ensure the page reloads
      window.location.href = fullUrl;
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };`;
  
  // Apply the fix
  if (problemPattern.test(dashboardContent)) {
    dashboardContent = dashboardContent.replace(problemPattern, replacement);
    fs.writeFileSync(dashboardContentPath, dashboardContent);
    console.log('✅ Applied fix to DashboardContent.tsx');
  } else {
    console.error('❌ Could not find the pattern to replace in DashboardContent.tsx');
    console.error('Please apply the fix manually:');
    console.error('1. Open src/components/dashboard/DashboardContent.tsx');
    console.error('2. Find the handleViewResults function');
    console.error('3. Replace it with the following code:');
    console.error(replacement);
    process.exit(1);
  }
}

// Create documentation for the fix
const docPath = path.join(process.cwd(), 'docs/dashboard-view-results-button-fix.md');
const docContent = `# Dashboard "View Results" Button Fix

## Issue
The "View Results" button on the dashboard was not working. When clicked, nothing happened - no errors were displayed in the console, and the user was not redirected to the scan results page.

## Investigation
We added extensive debug logging throughout the application to trace the issue:

1. In the DashboardContent component to log when the button is clicked and what scan ID is being used
2. In the dashboard page component to log when it loads with a scan ID and when it fetches scan results
3. In the scan results API route to log when it's called and what scan ID is being used
4. In the getScanResults function to log the database queries and results

The investigation revealed that the issue was with the router navigation. The router.push() method was not causing a page reload or navigation when called with the scan ID parameter.

## Fix
The fix modifies the handleViewResults function in the DashboardContent component to use window.location.href instead of router.push(). This forces a hard navigation to the scan results page, ensuring that the page reloads with the new scan ID parameter.

\`\`\`typescript
// Before
const handleViewResults = (scanId: string) => {
  router.push(\`/dashboard?scan=\${scanId}\`);
};

// After
const handleViewResults = (scanId: string) => {
  console.log('handleViewResults called with scanId:', scanId);
  
  // Use window.location.href for a hard navigation
  const fullUrl = \`/dashboard?scan=\${encodeURIComponent(scanId)}\`;
  window.location.href = fullUrl;
};
\`\`\`

This change ensures that the page fully reloads with the new scan ID parameter, triggering the useEffect hook in the dashboard page component that fetches the scan results.

## Implementation
The fix was implemented by modifying the handleViewResults function in the src/components/dashboard/DashboardContent.tsx file.

## Verification
To verify the fix:
1. Run the application
2. Go to the dashboard
3. Click the "View Results" button for a completed scan
4. Verify that the scan results are displayed correctly

## Related Files
- \`src/components/dashboard/DashboardContent.tsx\` - Modified to fix the "View Results" button
- \`src/app/dashboard/page.tsx\` - Added debug logging to help diagnose the issue
- \`src/app/api/scan/results/route.ts\` - Added debug logging to help diagnose the issue
- \`src/services/scanService.ts\` - Added debug logging to help diagnose the issue
- \`docs/dashboard-view-results-button-fix.md\` - This documentation file
`;

// Create the docs directory if it doesn't exist
const docsDir = path.join(process.cwd(), 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Only write the documentation if it doesn't exist
if (!fs.existsSync(docPath)) {
  fs.writeFileSync(docPath, docContent);
  console.log(`✅ Created documentation at ${docPath}`);
} else {
  console.log(`✅ Documentation already exists at ${docPath}`);
}

// Create a summary file
const summaryPath = path.join(process.cwd(), 'DASHBOARD-VIEW-RESULTS-BUTTON-FIX-SUMMARY.md');
const summaryContent = `# Dashboard "View Results" Button Fix Summary

## Issue
The "View Results" button on the dashboard was not working. When clicked, nothing happened - no errors were displayed in the console, and the user was not redirected to the scan results page.

## Fix
The fix modifies the handleViewResults function in the DashboardContent component to use window.location.href instead of router.push(). This forces a hard navigation to the scan results page, ensuring that the page reloads with the new scan ID parameter.

## Implementation
- Modified \`src/components/dashboard/DashboardContent.tsx\` to fix the "View Results" button
- Added debug logging to help diagnose the issue
- Created \`scripts/fix-dashboard-view-results-button.cjs\` to apply the fix
- Added documentation in \`docs/dashboard-view-results-button-fix.md\`

## Verification
To verify the fix:
1. Run the application
2. Go to the dashboard
3. Click the "View Results" button for a completed scan
4. Verify that the scan results are displayed correctly

For detailed information, see \`docs/dashboard-view-results-button-fix.md\`.
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
console.log('✅ Dashboard "View Results" button fix applied successfully');
console.log('');
console.log('To verify the fix in the application:');
console.log('1. Run the application');
console.log('2. Go to the dashboard');
console.log('3. Click the "View Results" button for a completed scan');
console.log('4. Verify that the scan results are displayed correctly');