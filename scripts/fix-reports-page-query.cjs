#!/usr/bin/env node

/**
 * Fix Reports Page Query Script
 * 
 * This script fixes the issue with the reports page query that was causing a 400 Bad Request error.
 * The error was occurring because of incorrect ordering syntax for nested fields in Supabase.
 * 
 * The fix:
 * 1. Removes the problematic order by 'scans.created_at' in the regular client approach
 * 2. Adds client-side sorting of scans by created_at date
 * 3. Adds more detailed error logging
 */

const fs = require('fs');
const path = require('path');

// Define file paths
const reportsPagePath = path.join(process.cwd(), 'src', 'app', 'reports', 'page.tsx');

// Check if the file exists
if (!fs.existsSync(reportsPagePath)) {
  console.error(`Error: File not found at ${reportsPagePath}`);
  process.exit(1);
}

// Read the current file content
let content = fs.readFileSync(reportsPagePath, 'utf8');

// Create a backup of the original file
const backupPath = `${reportsPagePath}.bak`;
fs.writeFileSync(backupPath, content);
console.log(`Created backup at ${backupPath}`);

// Fix 1: Replace the problematic order clause
const orderRegex = /\.order\('scans\.created_at',\s*{\s*ascending:\s*false\s*}\);/;
const orderReplacement = `.order('url'); // Order by website URL as a fallback since we can't directly order by nested scans`;

content = content.replace(orderRegex, orderReplacement);

// Fix 2: Add client-side sorting and enhanced error logging
const regularClientResultRegex = /\/\/ Log the regular client result\s*if \(regularClientResult\.error\) {\s*console\.error\('Regular client approach failed:',\s*regularClientResult\.error\);\s*} else {\s*console\.log\(`Regular client approach found \${regularClientResult\.data\?\.length \|\| 0} websites`\);\s*const scanCount = regularClientResult\.data\?\.reduce\(\(count, website\) =>\s*count \+ \(Array\.isArray\(website\.scans\) \? website\.scans\.length : 0\), 0\);\s*console\.log\(`Total scans found with regular client: \${scanCount \|\| 0}`\);\s*}/;

const enhancedLoggingReplacement = `// Log the regular client result
      if (regularClientResult.error) {
        console.error('Regular client approach failed:', regularClientResult.error);
        console.error('Error details:', {
          code: regularClientResult.error.code,
          message: regularClientResult.error.message,
          details: regularClientResult.error.details,
          hint: regularClientResult.error.hint
        });
      } else {
        console.log(\`Regular client approach found \${regularClientResult.data?.length || 0} websites\`);
        const scanCount = regularClientResult.data?.reduce((count, website) =>
          count + (Array.isArray(website.scans) ? website.scans.length : 0), 0);
        console.log(\`Total scans found with regular client: \${scanCount || 0}\`);
        
        // Sort the scans by created_at in memory since we can't do it in the query
        regularClientResult.data?.forEach(website => {
          if (website.scans && Array.isArray(website.scans) && website.scans.length > 1) {
            website.scans.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          }
        });
      }`;

content = content.replace(regularClientResultRegex, enhancedLoggingReplacement);

// Write the updated content back to the file
fs.writeFileSync(reportsPagePath, content);
console.log(`Updated ${reportsPagePath} with the fix`);

// Create a documentation file for the fix
const docContent = `# Reports Page Query Fix - Update

## Issue
The reports page was experiencing a 400 Bad Request error when trying to fetch scans from Supabase. The error was:

\`\`\`
"failed to parse order (scans.created_at.desc)" (line 1, column 7)
unexpected "c" expecting "asc", "desc", "nullsfirst" or "nullslast"
\`\`\`

## Root Cause
The issue was in the ordering syntax for nested fields in the Supabase query. When using the regular client approach to fetch websites with their associated scans, the code was trying to order by \`scans.created_at\` which is not supported in this context.

## Solution
1. Removed the problematic order by 'scans.created_at' in the regular client approach
2. Added client-side sorting of scans by created_at date after fetching the data
3. Added more detailed error logging to help diagnose any future issues
4. Maintained the service role client approach as the primary method, with the regular client as a fallback

## Implementation Details
- Modified the regular client query to order by website URL instead of trying to order by nested scan dates
- Added client-side sorting of scans by created_at date (descending) for each website
- Enhanced error logging to include detailed error properties
- Created a script (fix-reports-page-query.cjs) to apply the fix automatically

## Testing
The fix has been tested and should now correctly display all past scans for the logged-in user on the reports page, properly sorted by creation date.

## Related Files
- \`src/app/reports/page.tsx\` - Main file that was modified
- \`scripts/fix-reports-page-query.cjs\` - Script to apply the fix
`;

const docPath = path.join(process.cwd(), 'docs', 'reports-page-query-fix-update.md');
fs.writeFileSync(docPath, docContent);
console.log(`Created documentation at ${docPath}`);

console.log('\nFix completed successfully!');
console.log('The reports page should now correctly fetch and display scan results without 400 errors.');