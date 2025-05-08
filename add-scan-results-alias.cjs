#!/usr/bin/env node

/**
 * This script adds an alias for getScanResults in scanService.ts
 * to fix the import error in route.ts
 */

const fs = require('fs');
const path = require('path');

console.log('Adding getScanResults alias to scanService.ts...');

// Path to the scanService.ts file
const servicePath = path.resolve(process.cwd(), 'src/services/scanService.ts');
const backupPath = path.resolve(process.cwd(), 'backups/scanService.ts.bak4');

// Check if the file exists
if (!fs.existsSync(servicePath)) {
  console.error('scanService.ts file not found:', servicePath);
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
  fs.copyFileSync(servicePath, backupPath);
  console.log(`Created backup at ${backupPath}`);
} catch (error) {
  console.error('Error creating backup:', error);
  process.exit(1);
}

// Read the file
try {
  const content = fs.readFileSync(servicePath, 'utf8');
  
  // Add the alias at the end of the file
  const updatedContent = content + `
/**
 * Alias for getScanResult to maintain backward compatibility
 * @param scanId The scan ID
 * @returns The scan result
 */
export const getScanResults = getScanResult;
`;
  
  // Write the updated content back to the file
  fs.writeFileSync(servicePath, updatedContent);
  console.log(`Successfully added getScanResults alias to ${servicePath}`);
} catch (error) {
  console.error('Error updating file:', error);
  
  // Try to restore from backup
  try {
    fs.copyFileSync(backupPath, servicePath);
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