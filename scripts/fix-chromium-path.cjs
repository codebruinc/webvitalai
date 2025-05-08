#!/usr/bin/env node

/**
 * This script fixes the Chromium path issue by:
 * 1. Checking if Chromium is installed
 * 2. Finding the correct path to Chromium
 * 3. Creating a proper symlink or script
 * 4. Updating environment variables
 * 
 * It specifically addresses the error:
 * /opt/homebrew/bin/chromium: line 2: /Applications/Chromium.app/Contents/MacOS/Chromium: No such file or directory
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const VERBOSE = true;

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌ ERROR' : type === 'success' ? '✅ SUCCESS' : 'ℹ️ INFO';
  console.log(`[${timestamp}] ${prefix}: ${message}`);
}

function logVerbose(message) {
  if (VERBOSE) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔍 VERBOSE: ${message}`);
  }
}

function runCommand(command, options = {}) {
  logVerbose(`Running command: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', ...options });
    logVerbose(`Command output: ${output}`);
    return { success: true, output };
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    log(`Error: ${error.message}`, 'error');
    return { success: false, error };
  }
}

// Step 1: Check environment
log('Step 1: Checking environment...');
logVerbose(`Node version: ${process.version}`);
logVerbose(`Platform: ${os.platform()}`);
logVerbose(`Architecture: ${os.arch()}`);
logVerbose(`Current directory: ${process.cwd()}`);

// Check for required environment variables
const envVars = {
  NODE_ENV: process.env.NODE_ENV || 'Not set',
  PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || 'Not set',
  CHROME_PATH: process.env.CHROME_PATH || 'Not set',
  USE_MOCK_RESULTS: process.env.USE_MOCK_RESULTS || 'Not set'
};

Object.entries(envVars).forEach(([key, value]) => {
  logVerbose(`${key}: ${value}`);
});

// Step 2: Check the problematic path
log('Step 2: Checking problematic Chromium path...');
const problematicPath = '/opt/homebrew/bin/chromium';
const targetPath = '/Applications/Chromium.app/Contents/MacOS/Chromium';

if (fs.existsSync(problematicPath)) {
  log(`Found problematic path: ${problematicPath}`, 'info');
  
  // Check if it's a symlink or a script
  const stats = fs.lstatSync(problematicPath);
  if (stats.isSymbolicLink()) {
    const linkTarget = fs.readlinkSync(problematicPath);
    log(`It's a symlink pointing to: ${linkTarget}`, 'info');
  } else {
    log(`It's a regular file (probably a script)`, 'info');
    
    // Read the file to see what it's trying to execute
    const content = fs.readFileSync(problematicPath, 'utf8');
    log(`File content:\n${content}`, 'info');
  }
} else {
  log(`Problematic path not found: ${problematicPath}`, 'info');
}

// Step 3: Find Chromium
log('Step 3: Finding Chromium...');
let chromiumPath;

// Try to find using various methods
const findMethods = [
  // Method 1: Check if target path exists
  () => {
    if (fs.existsSync(targetPath)) {
      log(`Target path exists: ${targetPath}`, 'success');
      return targetPath;
    }
    return null;
  },
  
  // Method 2: Try to find using mdfind (macOS)
  () => {
    if (os.platform() === 'darwin') {
      try {
        const output = execSync('mdfind "kMDItemCFBundleIdentifier == \'org.chromium.Chromium\'" | head -n 1').toString().trim();
        if (output) {
          const chromiumApp = output;
          const executablePath = path.join(chromiumApp, 'Contents', 'MacOS', 'Chromium');
          if (fs.existsSync(executablePath)) {
            log(`Found Chromium using mdfind: ${executablePath}`, 'success');
            return executablePath;
          }
        }
      } catch (error) {
        log(`mdfind failed: ${error.message}`, 'error');
      }
    }
    return null;
  },
  
  // Method 3: Check common locations
  () => {
    const commonLocations = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/opt/google/chrome/chrome'
    ];
    
    for (const location of commonLocations) {
      if (fs.existsSync(location)) {
        log(`Found browser at common location: ${location}`, 'success');
        return location;
      }
    }
    return null;
  },
  
  // Method 4: Try to find using which command
  () => {
    try {
      if (os.platform() === 'darwin') {
        // macOS
        const output = execSync('which chromium 2>/dev/null || which google-chrome 2>/dev/null || echo ""').toString().trim();
        if (output && output !== problematicPath) {
          log(`Found browser using which command: ${output}`, 'success');
          return output;
        }
      } else if (os.platform() === 'linux') {
        // Linux
        const output = execSync('which chromium-browser 2>/dev/null || which chromium 2>/dev/null || which google-chrome 2>/dev/null || echo ""').toString().trim();
        if (output) {
          log(`Found browser using which command: ${output}`, 'success');
          return output;
        }
      }
    } catch (error) {
      log(`which command failed: ${error.message}`, 'error');
    }
    return null;
  },
  
  // Method 5: Try to get Puppeteer's bundled Chromium
  () => {
    try {
      const puppeteer = require('puppeteer');
      const executablePath = puppeteer.executablePath();
      if (fs.existsSync(executablePath)) {
        log(`Found Puppeteer's bundled Chromium: ${executablePath}`, 'success');
        return executablePath;
      }
    } catch (error) {
      log(`Failed to get Puppeteer's bundled Chromium: ${error.message}`, 'error');
    }
    return null;
  },
  
  // Method 6: Try to install Chromium using Homebrew (macOS)
  () => {
    if (os.platform() === 'darwin') {
      log('Attempting to install Chromium via Homebrew...', 'info');
      try {
        execSync('brew install --cask chromium', { stdio: 'inherit' });
        
        // Check if installation was successful
        if (fs.existsSync('/Applications/Chromium.app/Contents/MacOS/Chromium')) {
          log('Successfully installed Chromium via Homebrew', 'success');
          return '/Applications/Chromium.app/Contents/MacOS/Chromium';
        }
      } catch (error) {
        log(`Homebrew installation failed: ${error.message}`, 'error');
      }
    }
    return null;
  }
];

// Try each method until we find Chromium
for (const method of findMethods) {
  chromiumPath = method();
  if (chromiumPath) {
    break;
  }
}

if (!chromiumPath) {
  log('Could not find Chromium. Please install it manually.', 'error');
  process.exit(1);
}

// Step 4: Fix the Chromium path
log('Step 4: Fixing Chromium path...');

// Create a local script in the project
const localScriptPath = path.resolve(process.cwd(), 'scripts', 'chromium-browser');
log(`Creating local script at: ${localScriptPath}`, 'info');

const scriptContent = `#!/bin/sh
# This script was generated by fix-chromium-path.cjs
# It provides a wrapper for Chromium/Chrome
exec "${chromiumPath}" "$@"
`;

fs.writeFileSync(localScriptPath, scriptContent);
fs.chmodSync(localScriptPath, '755'); // Make executable
log('Created local script', 'success');

// Create a symbolic link in node_modules/.bin
const binDir = path.resolve(process.cwd(), 'node_modules', '.bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const binPath = path.join(binDir, 'chromium-browser');
if (fs.existsSync(binPath)) {
  fs.unlinkSync(binPath);
}

fs.symlinkSync(localScriptPath, binPath);
log(`Created symbolic link in node_modules/.bin`, 'success');

// Try to fix the problematic path if we have permission
if (fs.existsSync(problematicPath)) {
  log(`Attempting to fix problematic path: ${problematicPath}`, 'info');
  
  try {
    // Check if we have permission to write to /opt/homebrew/bin
    fs.accessSync(path.dirname(problematicPath), fs.constants.W_OK);
    
    // We have permission, replace the file
    fs.unlinkSync(problematicPath);
    fs.writeFileSync(problematicPath, scriptContent);
    fs.chmodSync(problematicPath, '755'); // Make executable
    log(`Fixed problematic path: ${problematicPath}`, 'success');
  } catch (error) {
    log(`Don't have permission to fix ${problematicPath}, will try using sudo`, 'info');
    
    try {
      // Create a temporary script
      const tempScriptPath = path.join(os.tmpdir(), `fix-chromium-${Date.now()}.sh`);
      const sudoScriptContent = `#!/bin/sh
cat > "${problematicPath}" << 'EOF'
#!/bin/sh
# This script was generated by fix-chromium-path.cjs
# It provides a wrapper for Chromium/Chrome
exec "${chromiumPath}" "$@"
EOF
chmod 755 "${problematicPath}"
`;
      
      fs.writeFileSync(tempScriptPath, sudoScriptContent);
      fs.chmodSync(tempScriptPath, '755');
      
      // Execute the script with sudo
      execSync(`sudo ${tempScriptPath}`, { stdio: 'inherit' });
      
      // Clean up
      fs.unlinkSync(tempScriptPath);
      
      log(`Fixed problematic path using sudo: ${problematicPath}`, 'success');
    } catch (sudoError) {
      log(`Failed to fix problematic path using sudo: ${sudoError.message}`, 'error');
    }
  }
}

// Step 5: Update environment variables
log('Step 5: Updating environment variables...');

// Update process environment variables
process.env.PUPPETEER_EXECUTABLE_PATH = chromiumPath;
process.env.CHROME_PATH = chromiumPath;
process.env.USE_MOCK_RESULTS = 'false';

// Update .env.local file
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update PUPPETEER_EXECUTABLE_PATH
  if (envContent.includes('PUPPETEER_EXECUTABLE_PATH=')) {
    envContent = envContent.replace(/PUPPETEER_EXECUTABLE_PATH=.*(\r?\n|$)/g, `PUPPETEER_EXECUTABLE_PATH=${chromiumPath}$1`);
  } else {
    envContent += `\nPUPPETEER_EXECUTABLE_PATH=${chromiumPath}\n`;
  }
  
  // Update CHROME_PATH
  if (envContent.includes('CHROME_PATH=')) {
    envContent = envContent.replace(/CHROME_PATH=.*(\r?\n|$)/g, `CHROME_PATH=${chromiumPath}$1`);
  } else {
    envContent += `\nCHROME_PATH=${chromiumPath}\n`;
  }
  
  // Set USE_MOCK_RESULTS to false
  if (envContent.includes('USE_MOCK_RESULTS=')) {
    envContent = envContent.replace(/USE_MOCK_RESULTS=.*(\r?\n|$)/g, 'USE_MOCK_RESULTS=false$1');
  } else {
    envContent += '\nUSE_MOCK_RESULTS=false\n';
  }
  
  fs.writeFileSync(envPath, envContent);
  log(`Updated ${envPath} with Chromium path`, 'success');
}

// Step 6: Verify the fix
log('Step 6: Verifying the fix...');

// Try to execute the chromium command
try {
  const result = execSync(`"${localScriptPath}" --version`).toString().trim();
  log(`Chromium version: ${result}`, 'success');
  log('Chromium path fix verified successfully!', 'success');
} catch (error) {
  log(`Verification failed: ${error.message}`, 'error');
  log('The fix may not have been successful. Please check the logs for details.', 'error');
  process.exit(1);
}

log('Chromium path has been fixed successfully!', 'success');
