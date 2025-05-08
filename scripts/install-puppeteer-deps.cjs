#!/usr/bin/env node

/**
 * This script installs Puppeteer and ensures that Chromium is installed
 * in the project directory. This is useful for deployment environments
 * where Chromium is not installed globally.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the root directory
const rootDir = path.resolve(__dirname, '..');

console.log('Installing Puppeteer dependencies...');

// Make sure puppeteer is installed
try {
  console.log('Checking if puppeteer is installed...');
  require.resolve('puppeteer');
  console.log('Puppeteer is already installed.');
} catch (e) {
  console.log('Installing puppeteer...');
  execSync('npm install puppeteer', { stdio: 'inherit', cwd: rootDir });
}

// Make sure @axe-core/puppeteer is installed
try {
  console.log('Checking if @axe-core/puppeteer is installed...');
  require.resolve('@axe-core/puppeteer');
  console.log('@axe-core/puppeteer is already installed.');
} catch (e) {
  console.log('Installing @axe-core/puppeteer...');
  execSync('npm install @axe-core/puppeteer', { stdio: 'inherit', cwd: rootDir });
}

// Make sure chrome-launcher is installed
try {
  console.log('Checking if chrome-launcher is installed...');
  require.resolve('chrome-launcher');
  console.log('chrome-launcher is already installed.');
} catch (e) {
  console.log('Installing chrome-launcher...');
  execSync('npm install chrome-launcher', { stdio: 'inherit', cwd: rootDir });
}

// Make sure lighthouse is installed
try {
  console.log('Checking if lighthouse is installed...');
  require.resolve('lighthouse');
  console.log('lighthouse is already installed.');
} catch (e) {
  console.log('Installing lighthouse...');
  execSync('npm install lighthouse', { stdio: 'inherit', cwd: rootDir });
}

// Ensure Puppeteer downloads Chromium
console.log('Ensuring Chromium is downloaded...');
try {
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit', cwd: rootDir });
  console.log('Chromium installation complete.');
} catch (e) {
  console.error('Error installing Chromium:', e);
  console.log('Trying alternative installation method...');
  
  try {
    // Alternative method to ensure Chromium is installed
    const puppeteer = require('puppeteer');
    
    // Create a temporary function to launch and close the browser
    const ensureChromium = async () => {
      const browser = await puppeteer.launch();
      await browser.close();
      console.log('Successfully launched and closed browser. Chromium is installed.');
    };
    
    // Execute the function
    ensureChromium().catch(err => {
      console.error('Failed to install Chromium:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to install Chromium:', err);
    process.exit(1);
  }
}

console.log('All dependencies installed successfully!');