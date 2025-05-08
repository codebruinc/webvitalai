#!/usr/bin/env node

/**
 * This script restores the original scanService.ts file from backup
 */

const fs = require('fs');
const path = require('path');

console.log('Restoring original scanService.ts file...');

// Path to the original file and backup
const originalPath = path.resolve(process.cwd(), 'src/services/scanService.ts');
const backupPath = path.resolve(process.cwd(), 'backups/scanService.ts.bak');

// Check if the backup file exists
if (!fs.existsSync(backupPath)) {
  console.error('Backup file not found:', backupPath);
  process.exit(1);
}

// Restore the original file from backup
try {
  fs.copyFileSync(backupPath, originalPath);
  console.log(`Successfully restored original file from backup to ${originalPath}`);
} catch (error) {
  console.error('Error restoring file:', error);
  process.exit(1);
}

console.log('\nRestore completed successfully!');