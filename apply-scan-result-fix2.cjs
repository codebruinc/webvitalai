#!/usr/bin/env node

/**
 * This script adds the missing getScanResult function to scanService.ts
 * to fix the import error in the route.ts file.
 * This version avoids duplicating imports and variables.
 */

const fs = require('fs');
const path = require('path');

console.log('Adding missing getScanResult function to scanService.ts...');

// Path to the original file and the fix file
const originalPath = path.resolve(process.cwd(), 'src/services/scanService.ts');
const fixPath = path.resolve(process.cwd(), 'src/services/scanService.ts.fix3');
const backupPath = path.resolve(process.cwd(), 'backups/scanService.ts.bak3');

// Check if the fix file exists
if (!fs.existsSync(fixPath)) {
  console.error('Fix file not found:', fixPath);
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

// Read the original file and the fix file
try {
  const originalContent = fs.readFileSync(originalPath, 'utf8');
  const fixContent = fs.readFileSync(fixPath, 'utf8');
  
  // Restore the original file from the backup
  fs.copyFileSync(backupPath, originalPath);
  console.log('Restored original file from backup');
  
  // Append the fix content to the original file
  fs.appendFileSync(originalPath, '\n\n' + fixContent);
  console.log(`Successfully added getScanResult function to ${originalPath}`);
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