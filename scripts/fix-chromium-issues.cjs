#!/usr/bin/env node

/**
 * This script fixes Chromium/Puppeteer issues by:
 * 1. Installing required dependencies
 * 2. Setting up the Chromium path
 * 3. Configuring environment variables
 * 4. Verifying the setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Chromium/Puppeteer fix...');

// Function to run a script and handle errors
function runScript(scriptPath, description) {
  console.log(`\n=== ${description} ===`);
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Step 1: Install Puppeteer dependencies
console.log('\nStep 1: Installing Puppeteer dependencies...');
const installDepsSuccess = runScript(
  path.resolve(__dirname, 'install-puppeteer-deps.cjs'),
  'Installing Puppeteer dependencies'
);

// Step 2: Set up Chromium path
console.log('\nStep 2: Setting up Chromium path...');
const setChromiumPathSuccess = runScript(
  path.resolve(__dirname, 'set-chromium-path.cjs'),
  'Setting up Chromium path'
);

// Step 3: Create Chromium symlink if needed
console.log('\nStep 3: Creating Chromium symlink if needed...');
const setupSymlinkSuccess = runScript(
  path.resolve(__dirname, 'setup-chromium-symlink.cjs'),
  'Creating Chromium symlink'
);

// Step 4: Make scripts executable
console.log('\nStep 4: Making scripts executable...');
try {
  execSync(`chmod +x "${path.resolve(__dirname, 'make-chromium-scripts-executable.sh')}"`, { stdio: 'inherit' });
  execSync(`"${path.resolve(__dirname, 'make-chromium-scripts-executable.sh')}"`, { stdio: 'inherit' });
  console.log('✅ Made scripts executable');
} catch (error) {
  console.error('❌ Failed to make scripts executable:', error.message);
}

// Step 5: Update environment variables
console.log('\nStep 5: Updating environment variables...');
const envPath = path.resolve(process.cwd(), '.env.local');
try {
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Ensure USE_MOCK_RESULTS is set to false
    if (envContent.includes('USE_MOCK_RESULTS=')) {
      envContent = envContent.replace(/USE_MOCK_RESULTS=.*(\r?\n|$)/g, 'USE_MOCK_RESULTS=false$1');
    } else {
      envContent += '\nUSE_MOCK_RESULTS=false\n';
    }
    
    // Ensure PUPPETEER_SKIP_CHROMIUM_DOWNLOAD is set to false
    if (envContent.includes('PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=')) {
      envContent = envContent.replace(/PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=.*(\r?\n|$)/g, 'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false$1');
    } else {
      envContent += '\nPUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false\n';
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated environment variables');
  } else {
    console.error('❌ .env.local file not found');
  }
} catch (error) {
  console.error('❌ Failed to update environment variables:', error.message);
}

// Step 6: Verify the setup
console.log('\nStep 6: Verifying the setup...');
const verifySuccess = runScript(
  path.resolve(__dirname, 'verify-chromium-setup.cjs'),
  'Verifying Chromium setup'
);

// Summary
console.log('\n=== Summary ===');
console.log(`Install dependencies: ${installDepsSuccess ? '✅ Success' : '❌ Failed'}`);
console.log(`Set Chromium path: ${setChromiumPathSuccess ? '✅ Success' : '❌ Failed'}`);
console.log(`Create symlink: ${setupSymlinkSuccess ? '✅ Success' : '❌ Failed'}`);
console.log(`Verify setup: ${verifySuccess ? '✅ Success' : '❌ Failed'}`);

if (installDepsSuccess && setChromiumPathSuccess && verifySuccess) {
  console.log('\n✅ Chromium/Puppeteer issues have been fixed successfully!');
  console.log('\nYou should now be able to run Lighthouse and Axe audits without falling back to mock results.');
  console.log('\nIf you still encounter issues, try the following:');
  console.log('1. Restart your application');
  console.log('2. Check if Chromium is installed and accessible');
  console.log('3. Run "node scripts/verify-chromium-setup.cjs" to diagnose issues');
} else {
  console.log('\n❌ Some issues could not be fixed automatically.');
  console.log('\nPlease try the following manual steps:');
  console.log('1. Install Chromium: brew install chromium (on macOS) or apt-get install chromium-browser (on Linux)');
  console.log('2. Set the PUPPETEER_EXECUTABLE_PATH environment variable to the path of your Chromium installation');
  console.log('3. Set USE_MOCK_RESULTS=false in your .env.local file');
  console.log('4. Restart your application');
}

console.log('\nDone!');