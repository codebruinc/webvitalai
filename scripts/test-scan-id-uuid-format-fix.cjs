#!/usr/bin/env node

/**
 * Test script for the scan ID UUID format fix
 * This script tests that the "View Results" button works correctly after the fix
 */

const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

async function testViewResultsButton() {
  console.log('Testing the "View Results" button functionality...');
  
  // Launch a headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the dashboard
    console.log('Navigating to the dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    // Check if we need to log in
    const loginFormSelector = 'form[action="/login"]';
    const hasLoginForm = await page.evaluate((selector) => {
      return document.querySelector(selector) !== null;
    }, loginFormSelector);
    
    if (hasLoginForm) {
      console.log('Login form detected, logging in...');
      
      // Fill in the login form (replace with test credentials)
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('input[name="password"]', 'password123');
      
      // Submit the form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
      
      console.log('Logged in successfully');
    }
    
    // Wait for the dashboard to load
    await page.waitForSelector('.dashboard-content', { timeout: 5000 });
    
    // Check if there are any websites with completed scans
    const hasCompletedScans = await page.evaluate(() => {
      const viewResultsButtons = Array.from(document.querySelectorAll('button')).filter(
        button => button.textContent.trim() === 'View Results'
      );
      return viewResultsButtons.length > 0;
    });
    
    if (!hasCompletedScans) {
      console.log('No websites with completed scans found. Creating a new scan...');
      
      // Navigate to the home page to create a new scan
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
      
      // Fill in the URL form
      await page.type('input[name="url"]', 'https://example.com');
      
      // Submit the form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
      
      console.log('Scan initiated, waiting for completion...');
      
      // Wait for the scan to complete (this might take some time)
      await page.waitForFunction(
        () => !document.querySelector('.loading-indicator'),
        { timeout: 60000 }
      );
      
      console.log('Scan completed, navigating back to dashboard...');
      
      // Navigate back to the dashboard
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    }
    
    // Find and click the "View Results" button
    console.log('Looking for "View Results" button...');
    const viewResultsButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(
        button => button.textContent.trim() === 'View Results'
      );
      return buttons.length > 0;
    });
    
    if (!viewResultsButton) {
      throw new Error('No "View Results" button found on the dashboard');
    }
    
    console.log('Found "View Results" button, clicking it...');
    
    // Click the first "View Results" button
    await Promise.all([
      page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter(
          button => button.textContent.trim() === 'View Results'
        );
        if (buttons.length > 0) {
          buttons[0].click();
        }
      }),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    
    // Check if we've navigated to the scan results page
    const isOnResultsPage = await page.evaluate(() => {
      return document.querySelector('h3.text-lg.font-medium.leading-6.text-gray-900') !== null &&
             document.querySelector('h3.text-lg.font-medium.leading-6.text-gray-900').textContent.includes('Scan Results');
    });
    
    if (isOnResultsPage) {
      console.log('✅ Successfully navigated to scan results page');
      console.log('✅ "View Results" button is working correctly');
    } else {
      throw new Error('Failed to navigate to scan results page');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the test
testViewResultsButton().then(() => {
  console.log('');
  console.log('✅ All tests passed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});