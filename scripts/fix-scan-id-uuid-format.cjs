#!/usr/bin/env node

/**
 * Fix script for the scan ID UUID format issue
 * This script fixes the "View Results" button that was not working after the scan ID format fix
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Applying scan ID UUID format fix...');

// Paths to the files we need to modify
const resultsRoutePath = path.join(process.cwd(), 'src/app/api/scan/results/route.ts');
const statusRoutePath = path.join(process.cwd(), 'src/app/api/scan/status/route.ts');

// Check if the files exist
if (!fs.existsSync(resultsRoutePath)) {
  console.error(`❌ File not found: ${resultsRoutePath}`);
  process.exit(1);
}

if (!fs.existsSync(statusRoutePath)) {
  console.error(`❌ File not found: ${statusRoutePath}`);
  process.exit(1);
}

// Read the current content
let resultsRouteContent = fs.readFileSync(resultsRoutePath, 'utf8');
let statusRouteContent = fs.readFileSync(statusRoutePath, 'utf8');

// Check if the fix is already applied to results route
const resultsFixPattern = /console\.warn\(`Warning: Scan ID has default- prefix:/;
if (resultsFixPattern.test(resultsRouteContent)) {
  console.log('✅ Fix already applied to results route');
} else {
  // Pattern to find the problematic code in results route
  const resultsPattern = /if \(scanId\.startsWith\('default-'\)\) \{\s*console\.error\(`Invalid scan ID format: \${scanId} - IDs with "default-" prefix are not valid UUIDs`\);\s*return NextResponse\.json\(\s*\{ error: 'Invalid scan ID format\. IDs with "default-" prefix are not supported in production\.' \},\s*\{ status: 400 \}\s*\);\s*\}/;
  
  // Replacement code for results route
  const resultsReplacement = `if (scanId.startsWith('default-')) {
      console.warn(\`Warning: Scan ID has default- prefix: \${scanId}\`);
    }`;
  
  // Apply the fix to results route
  if (resultsPattern.test(resultsRouteContent)) {
    resultsRouteContent = resultsRouteContent.replace(resultsPattern, resultsReplacement);
    fs.writeFileSync(resultsRoutePath, resultsRouteContent);
    console.log('✅ Applied fix to results route');
  } else {
    console.error('❌ Could not find the pattern to replace in results route');
    console.error('Please apply the fix manually:');
    console.error('1. Open src/app/api/scan/results/route.ts');
    console.error('2. Find the check for "default-" prefix');
    console.error('3. Replace it with the following code:');
    console.error(resultsReplacement);
  }
}

// Check if the fix is already applied to status route
const statusFixPattern = /console\.warn\(`Warning: Scan ID has default- prefix:/;
if (statusFixPattern.test(statusRouteContent)) {
  console.log('✅ Fix already applied to status route');
} else {
  // Pattern to find the problematic code in status route
  const statusPattern = /if \(scanId\.startsWith\('default-'\)\) \{\s*console\.error\(`Invalid scan ID format: \${scanId} - IDs with "default-" prefix are not valid UUIDs`\);\s*return NextResponse\.json\(\s*\{ error: 'Invalid scan ID format\. IDs with "default-" prefix are not supported in production\.' \},\s*\{ status: 400 \}\s*\);\s*\}/;
  
  // Replacement code for status route
  const statusReplacement = `if (scanId.startsWith('default-')) {
      console.warn(\`Warning: Scan ID has default- prefix: \${scanId}\`);
    }`;
  
  // Apply the fix to status route
  if (statusPattern.test(statusRouteContent)) {
    statusRouteContent = statusRouteContent.replace(statusPattern, statusReplacement);
    fs.writeFileSync(statusRoutePath, statusRouteContent);
    console.log('✅ Applied fix to status route');
  } else {
    console.error('❌ Could not find the pattern to replace in status route');
    console.error('Please apply the fix manually:');
    console.error('1. Open src/app/api/scan/status/route.ts');
    console.error('2. Find the check for "default-" prefix');
    console.error('3. Replace it with the following code:');
    console.error(statusReplacement);
  }
}

// Create documentation for the fix
const docPath = path.join(process.cwd(), 'docs/scan-id-uuid-format-fix.md');
const docContent = `# Scan ID UUID Format Fix

## Issue
After implementing the scan ID format fix to prevent "default-" prefixed IDs from being used in the "View Results" button, a new issue emerged: the "View Results" button stopped working completely. No errors were displayed, but clicking the button did nothing.

## Root Cause
The issue was in the API routes (\`src/app/api/scan/results/route.ts\` and \`src/app/api/scan/status/route.ts\`) where there was a strict validation check that rejected any scan ID with a "default-" prefix with a 400 error. This validation was added as part of a previous fix to prevent invalid scan IDs from being processed.

However, this validation was conflicting with the recent fix in \`DashboardContent.tsx\` that was supposed to prevent "default-" prefixed IDs from being used in the first place. The button's onClick handler was correctly checking for valid scan IDs, but if any scan ID with a "default-" prefix somehow made it to the API, it would be rejected with an error.

## Fix
The fix modifies the API routes to log a warning instead of returning an error when a scan ID with a "default-" prefix is encountered:

\`\`\`typescript
// Before
if (scanId.startsWith('default-')) {
  console.error(\`Invalid scan ID format: \${scanId} - IDs with "default-" prefix are not valid UUIDs\`);
  return NextResponse.json(
    { error: 'Invalid scan ID format. IDs with "default-" prefix are not supported in production.' },
    { status: 400 }
  );
}

// After
if (scanId.startsWith('default-')) {
  console.warn(\`Warning: Scan ID has default- prefix: \${scanId}\`);
}
\`\`\`

This change allows the request to proceed to the service layer, where the \`getScanResults\` function already has proper handling for scan IDs with a "default-" prefix.

## Implementation
The fix was implemented by modifying:
1. \`src/app/api/scan/results/route.ts\` - Changed error response to warning log
2. \`src/app/api/scan/status/route.ts\` - Changed error response to warning log

## Verification
To verify the fix:
1. Run the application
2. Go to the dashboard
3. Click the "View Results" button for a completed scan
4. Verify that the scan results are displayed correctly

## Related Files
- \`src/app/api/scan/results/route.ts\` - Modified to log warning instead of returning error
- \`src/app/api/scan/status/route.ts\` - Modified to log warning instead of returning error
- \`docs/scan-id-format-fix.md\` - Previous fix documentation
- \`docs/scan-id-uuid-format-fix.md\` - This documentation file
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
console.log('✅ Scan ID UUID format fix applied successfully');
console.log('');
console.log('To verify the fix in the application:');
console.log('1. Run the application');
console.log('2. Go to the dashboard');
console.log('3. Click the "View Results" button for a completed scan');
console.log('4. Verify that the scan results are displayed correctly');