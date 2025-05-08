#!/usr/bin/env node

/**
 * This script fixes the import in route.ts to use getScanResults instead of getScanResult
 */

const fs = require('fs');
const path = require('path');

console.log('Fixing import in route.ts...');

// Path to the route file
const routePath = path.resolve(process.cwd(), 'src/app/api/scan/results/route.ts');
const backupPath = path.resolve(process.cwd(), 'backups/route.ts.bak');

// Check if the route file exists
if (!fs.existsSync(routePath)) {
  console.error('Route file not found:', routePath);
  process.exit(1);
}

// Create backups directory if it doesn't exist
const backupsDir = path.dirname(backupPath);
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
  console.log('Created backups directory');
}

// Create a backup of the original file
try {
  fs.copyFileSync(routePath, backupPath);
  console.log(`Created backup at ${backupPath}`);
} catch (error) {
  console.error('Error creating backup:', error);
  process.exit(1);
}

// Read the route file
try {
  let content = fs.readFileSync(routePath, 'utf8');
  
  // Replace getScanResult with getScanResults
  const updatedContent = content.replace(
    "import { getScanResult } from '@/services/scanService';",
    "import { getScanResults } from '@/services/scanService';"
  );
  
  // Replace all occurrences of getScanResult with getScanResults in function calls
  const finalContent = updatedContent.replace(/getScanResult\(/g, "getScanResults(");
  
  // Write the updated content back to the file
  fs.writeFileSync(routePath, finalContent);
  console.log(`Successfully updated import in ${routePath}`);
} catch (error) {
  console.error('Error updating route file:', error);
  
  // Try to restore from backup
  try {
    fs.copyFileSync(backupPath, routePath);
    console.log('Restored original file from backup');
  } catch (restoreError) {
    console.error('Error restoring from backup:', restoreError);
  }
  
  process.exit(1);
}

console.log('\nFix applied successfully!');
console.log('\nNext steps:');
console.log('1. Rebuild the application: npm run build');
console.log('2. Restart the application: npm run start');
console.log('3. Test creating a new scan');