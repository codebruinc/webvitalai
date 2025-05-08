/**
 * Puppeteer configuration file for Render.com deployment
 * This file configures Puppeteer to use the correct Chromium executable
 * and sets other options for running in a containerized environment.
 */

const { join } = require('path');

/**
 * @type {import('puppeteer').Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to a directory that's writable in Render
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || join(__dirname, '.cache', 'puppeteer'),
  
  // Skip downloading Chromium if we're using the system one
  skipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true',
  
  // Use the system Chromium if available
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  
  // Default browser revision to use if not specified
  browserRevision: '136.0.7103.49',
  
  // Additional launch arguments for Chromium
  defaultLaunchOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    headless: true
  }
};