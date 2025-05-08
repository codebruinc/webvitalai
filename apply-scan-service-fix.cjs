#!/usr/bin/env node

/**
 * This script applies the fix to the scanService.ts file
 * to ensure it always uses the service role client for database operations.
 */

const fs = require('fs');
const path = require('path');

console.log('Applying fix to scanService.ts...');

// Path to the original and fixed files
const originalPath = path.resolve(process.cwd(), 'src/services/scanService.ts');
const fixedPath = path.resolve(process.cwd(), 'src/services/scanService.ts.fix');
const backupPath = path.resolve(process.cwd(), 'backups/scanService.ts.bak');

// Check if the fixed file exists
if (!fs.existsSync(fixedPath)) {
  console.error('Fixed file not found:', fixedPath);
  process.exit(1);
}

// Check if the original file exists
if (!fs.existsSync(originalPath)) {
  console.error('Original file not found:', originalPath);
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
  fs.copyFileSync(originalPath, backupPath);
  console.log(`Created backup at ${backupPath}`);
} catch (error) {
  console.error('Error creating backup:', error);
  process.exit(1);
}

// Apply the fix
try {
  const fixedContent = fs.readFileSync(fixedPath, 'utf8');
  fs.writeFileSync(originalPath, fixedContent);
  console.log(`Successfully applied fix to ${originalPath}`);
} catch (error) {
  console.error('Error applying fix:', error);
  
  // Try to restore from backup
  try {
    fs.copyFileSync(backupPath, originalPath);
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
console.log('\nThis fix ensures that all database operations in scanService.ts');
console.log('use the service role client, which bypasses RLS policies.');