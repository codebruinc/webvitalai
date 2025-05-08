/**
 * Verification script for WebVitalAI production mode (CommonJS version)
 * 
 * This script verifies that:
 * 1. The application correctly identifies the current mode (testing vs. production)
 * 2. No testing code runs when in production mode
 * 3. API endpoints return appropriate responses in production mode
 * 4. No "TESTING MODE" console logs appear in production
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Helper function to log test results
function logTest(name, passed, message) {
  const status = passed 
    ? `${colors.green}✓ PASS${colors.reset}` 
    : `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`${status} ${name}`);
  if (message) {
    console.log(`   ${message}`);
  }
  
  results.tests.push({
    name,
    passed,
    message
  });
  
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

// Helper function to log warnings
function logWarning(message) {
  console.log(`${colors.yellow}⚠ WARNING${colors.reset} ${message}`);
  results.warnings++;
}

// Helper function to check if a file contains a specific string
function fileContains(filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(searchString);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return false;
  }
}

// Helper function to check environment variables
function checkEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    content.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') return;
      
      // Parse key-value pairs
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error(`Error reading env file ${filePath}:`, error);
    return {};
  }
}

// Main verification function
async function verifyProductionMode() {
  console.log(`\n${colors.bold}${colors.cyan}WebVitalAI Production Mode Verification${colors.reset}\n`);
  
  // 1. Check if the application correctly identifies the current mode
  console.log(`\n${colors.bold}1. Checking Mode Identification${colors.reset}`);
  
  // Check .env.local file
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envVars = checkEnvFile(envLocalPath);
    
    logTest(
      'NODE_ENV is set to production in .env.local',
      envVars['NODE_ENV'] === 'production',
      envVars['NODE_ENV'] === 'production' 
        ? 'NODE_ENV is correctly set to production' 
        : `NODE_ENV is set to ${envVars['NODE_ENV'] || 'undefined'} instead of production`
    );
    
    logTest(
      'TESTING_MODE is set to false in .env.local',
      envVars['TESTING_MODE'] === 'false',
      envVars['TESTING_MODE'] === 'false' 
        ? 'TESTING_MODE is correctly set to false' 
        : `TESTING_MODE is set to ${envVars['TESTING_MODE'] || 'undefined'} instead of false`
    );
  } else {
    logTest(
      '.env.local file exists',
      false,
      '.env.local file not found. Run set-production-mode.js to create it.'
    );
  }
  
  // 2. Check that no testing code runs in production mode
  console.log(`\n${colors.bold}2. Checking for Testing Code in Production${colors.reset}`);
  
  // Check for testing bypass code in API routes
  const apiFiles = [
    'src/app/api/scan/route.ts',
    'src/app/api/scan/status/route.ts',
    'src/app/api/scan/results/route.ts'
  ];
  
  let testingBypassChecks = 0;
  let testingBypassWithProductionCheck = 0;
  
  for (const file of apiFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file contains testing bypass code
      if (content.includes('x-testing-bypass')) {
        testingBypassChecks++;
        
        // Check if testing bypass is properly guarded against production use
        if (content.includes('isTestingMode') && 
            content.includes('Testing bypass not allowed in production mode')) {
          testingBypassWithProductionCheck++;
        }
      }
    }
  }
  
  logTest(
    'Testing bypass code is properly guarded in API routes',
    testingBypassChecks === 0 || testingBypassChecks === testingBypassWithProductionCheck,
    testingBypassChecks === 0 
      ? 'No testing bypass code found in API routes' 
      : testingBypassChecks === testingBypassWithProductionCheck
        ? 'All testing bypass code is properly guarded against production use'
        : 'Some testing bypass code is not properly guarded against production use'
  );
  
  // Check for mock data in services
  const serviceFiles = [
    'src/services/scanService.ts',
    'src/services/lighthouseService.ts',
    'src/services/axeService.ts',
    'src/services/securityHeadersService.ts'
  ];
  
  let mockDataChecks = 0;
  let mockDataWithProductionCheck = 0;
  
  for (const file of serviceFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file contains mock data
      if (content.includes('mock') || content.includes('Mock')) {
        mockDataChecks++;
        
        // Check if mock data is properly guarded against production use
        if ((content.includes('isTestingMode') || content.includes('TESTING_MODE')) && 
            content.includes('NODE_ENV')) {
          mockDataWithProductionCheck++;
        }
      }
    }
  }
  
  logTest(
    'Mock data is properly guarded in services',
    mockDataChecks === 0 || mockDataChecks === mockDataWithProductionCheck,
    mockDataChecks === 0 
      ? 'No mock data found in services' 
      : mockDataChecks === mockDataWithProductionCheck
        ? 'All mock data is properly guarded against production use'
        : 'Some mock data is not properly guarded against production use'
  );
  
  // 3. Check API endpoints for appropriate responses in production mode
  console.log(`\n${colors.bold}3. Checking API Endpoints in Production Mode${colors.reset}`);
  
  // Note: This is a basic check. For a complete test, the application should be running.
  logWarning('For complete API endpoint testing, ensure the application is running with:');
  logWarning('  npm run build && npm run start');
  logWarning('Then use a tool like Postman or curl to test the endpoints.');
  
  // Check if API routes are configured for dynamic rendering
  const apiRoutesWithDynamic = 0;
  const totalApiRoutes = 0;
  
  fs.readdirSync('src/app/api', { recursive: true }).forEach(file => {
    if (file.endsWith('route.ts') || file.endsWith('route.js')) {
      totalApiRoutes++;
      const filePath = path.join('src/app/api', file);
      if (fileContains(filePath, "export const dynamic = 'force-dynamic'")) {
        apiRoutesWithDynamic++;
      }
    }
  });
  
  if (totalApiRoutes > 0) {
    logTest(
      'API routes are configured for dynamic rendering',
      apiRoutesWithDynamic === totalApiRoutes,
      `${apiRoutesWithDynamic}/${totalApiRoutes} API routes are configured for dynamic rendering`
    );
  } else {
    logWarning('No API routes found to check for dynamic rendering configuration');
  }
  
  // 4. Check for "TESTING MODE" console logs
  console.log(`\n${colors.bold}4. Checking for Testing Mode Console Logs${colors.reset}`);
  
  let testingModeLogsCount = 0;
  let testingModeLogsWithCheck = 0;
  
  // Recursively search for files in src directory
  function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        searchDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for console logs with "TESTING MODE"
        const testingModeLogMatches = content.match(/console\.(log|info|debug).*TESTING MODE/g);
        if (testingModeLogMatches) {
          testingModeLogsCount += testingModeLogMatches.length;
          
          // Check if logs are properly guarded
          const guardedMatches = content.match(/if.*isTestingMode.*console\.(log|info|debug).*TESTING MODE/g);
          if (guardedMatches) {
            testingModeLogsWithCheck += guardedMatches.length;
          }
        }
      }
    }
  }
  
  searchDirectory('src');
  
  logTest(
    'Testing mode console logs are properly guarded',
    testingModeLogsCount === 0 || testingModeLogsCount === testingModeLogsWithCheck,
    testingModeLogsCount === 0 
      ? 'No testing mode console logs found' 
      : testingModeLogsCount === testingModeLogsWithCheck
        ? 'All testing mode console logs are properly guarded'
        : `${testingModeLogsCount - testingModeLogsWithCheck}/${testingModeLogsCount} testing mode console logs are not properly guarded`
  );
  
  // Summary
  console.log(`\n${colors.bold}Verification Summary${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  
  if (results.failed > 0) {
    console.log(`\n${colors.red}${colors.bold}⚠ Production mode verification failed with ${results.failed} issues${colors.reset}`);
    console.log(`Please fix the issues above and run this script again.`);
  } else {
    console.log(`\n${colors.green}${colors.bold}✓ Production mode verification passed!${colors.reset}`);
    console.log(`Your application is correctly configured for production mode.`);
  }
}

// Run the verification
verifyProductionMode().catch(error => {
  console.error('Verification failed with error:', error);
  process.exit(1);
});