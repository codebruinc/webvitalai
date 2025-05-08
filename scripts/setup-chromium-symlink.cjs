#!/usr/bin/env node

/**
 * This script creates a symbolic link to the Chromium browser in the expected location.
 * It helps resolve the "browser not found" error by linking the installed Chromium
 * to the path that Puppeteer is looking for.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine the OS
const platform = os.platform();
console.log(`Detected platform: ${platform}`);

// Find the Chromium executable
let chromiumPath;
try {
  if (platform === 'darwin') {
    // macOS
    chromiumPath = execSync('which chromium').toString().trim();
    console.log(`Found Chromium at: ${chromiumPath}`);
  } else if (platform === 'linux') {
    // Linux
    try {
      chromiumPath = execSync('which chromium-browser').toString().trim();
    } catch (e) {
      chromiumPath = execSync('which chromium').toString().trim();
    }
    console.log(`Found Chromium at: ${chromiumPath}`);
  } else if (platform === 'win32') {
    // Windows - more complex, would need to search in Program Files
    console.log('Windows platform detected, please manually set the path to Chrome/Chromium');
    process.exit(1);
  }
} catch (error) {
  console.error('Could not find Chromium using "which" command');
  
  // Try to find Puppeteer's installed Chrome
  try {
    const puppeteerPath = require.resolve('puppeteer');
    const puppeteerRoot = path.dirname(path.dirname(puppeteerPath));
    
    if (platform === 'darwin') {
      // macOS
      const possiblePaths = [
        path.join(os.homedir(), '.cache', 'puppeteer', 'chrome', 'mac-*', 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        path.join(os.homedir(), '.cache', 'puppeteer', 'chrome', 'mac_arm-*', 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
      ];
      
      for (const pattern of possiblePaths) {
        const matches = require('glob').sync(pattern);
        if (matches.length > 0) {
          chromiumPath = matches[0];
          console.log(`Found Puppeteer's Chrome at: ${chromiumPath}`);
          break;
        }
      }
    } else if (platform === 'linux') {
      // Linux
      const possiblePaths = [
        path.join(os.homedir(), '.cache', 'puppeteer', 'chrome', 'linux-*', 'chrome-linux', 'chrome')
      ];
      
      for (const pattern of possiblePaths) {
        const matches = require('glob').sync(pattern);
        if (matches.length > 0) {
          chromiumPath = matches[0];
          console.log(`Found Puppeteer's Chrome at: ${chromiumPath}`);
          break;
        }
      }
    }
  } catch (e) {
    console.error('Could not find Puppeteer installation:', e);
  }
}

if (!chromiumPath) {
  console.error('Could not find Chromium. Please install it or specify the path manually.');
  process.exit(1);
}

// Create the target directory if it doesn't exist
const targetDir = '/usr/bin';
const targetPath = path.join(targetDir, 'chromium-browser');

console.log(`Creating symbolic link from ${chromiumPath} to ${targetPath}`);

try {
  // Check if we have permission to write to /usr/bin
  try {
    fs.accessSync(targetDir, fs.constants.W_OK);
    console.log(`Have write permission to ${targetDir}`);
  } catch (e) {
    console.log(`Don't have write permission to ${targetDir}, will use sudo`);
    
    // Create the symbolic link using sudo
    execSync(`sudo ln -sf "${chromiumPath}" "${targetPath}"`, { stdio: 'inherit' });
    console.log(`Created symbolic link using sudo`);
    process.exit(0);
  }
  
  // If we have permission, create the link directly
  fs.symlinkSync(chromiumPath, targetPath);
  console.log(`Created symbolic link`);
} catch (error) {
  console.error('Error creating symbolic link:', error);
  
  // Alternative approach: modify the environment variable
  console.log('Trying alternative approach: setting CHROME_PATH in .env.local');
  
  const envPath = path.resolve(process.cwd(), '.env.local');
  let envContent = '';
  
  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add CHROME_PATH
    if (envContent.includes('CHROME_PATH=')) {
      envContent = envContent.replace(/CHROME_PATH=.*(\r?\n|$)/g, `CHROME_PATH=${chromiumPath}$1`);
    } else {
      envContent += `\nCHROME_PATH=${chromiumPath}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated ${envPath} with CHROME_PATH=${chromiumPath}`);
    
    // Also create a local chromium-browser script in the project
    const localScriptPath = path.resolve(process.cwd(), 'scripts', 'chromium-browser');
    const scriptContent = `#!/bin/sh\nexec "${chromiumPath}" "$@"\n`;
    
    fs.writeFileSync(localScriptPath, scriptContent);
    fs.chmodSync(localScriptPath, '755'); // Make executable
    
    console.log(`Created local chromium-browser script at ${localScriptPath}`);
    
    // Create a symbolic link in the node_modules/.bin directory
    const binDir = path.resolve(process.cwd(), 'node_modules', '.bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }
    
    const binPath = path.join(binDir, 'chromium-browser');
    if (fs.existsSync(binPath)) {
      fs.unlinkSync(binPath);
    }
    
    fs.symlinkSync(localScriptPath, binPath);
    console.log(`Created symbolic link in node_modules/.bin`);
  } catch (e) {
    console.error('Error updating environment or creating local script:', e);
    process.exit(1);
  }
}

console.log('Done!');