/**
 * Script to update .env.local file to set production mode
 * This will disable test data and ensure real scan results
 */

const fs = require('fs');
const path = require('path');

// Path to .env.local file
const envFilePath = path.join(process.cwd(), '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envFilePath)) {
  console.log('.env.local file not found. Creating a new one...');
  
  // Create minimal .env.local with production settings
  const minimalEnv = `# Production mode settings
NODE_ENV=production
TESTING_MODE=false

# Add your other environment variables below
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
`;

  fs.writeFileSync(envFilePath, minimalEnv);
  console.log('Created new .env.local file with production settings.');
  process.exit(0);
}

// Read existing .env.local file
console.log('Reading existing .env.local file...');
const envContent = fs.readFileSync(envFilePath, 'utf8');

// Parse environment variables
const envLines = envContent.split('\n');
const envVars = {};
let hasNodeEnv = false;
let hasTestingMode = false;

envLines.forEach(line => {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || line.trim() === '') return;
  
  // Parse key-value pairs
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
    
    if (key === 'NODE_ENV') hasNodeEnv = true;
    if (key === 'TESTING_MODE') hasTestingMode = true;
  }
});

// Update environment variables
let updated = false;

if (!hasNodeEnv || envVars['NODE_ENV'] !== 'production') {
  envVars['NODE_ENV'] = 'production';
  updated = true;
  console.log('Updated NODE_ENV to production');
}

if (!hasTestingMode || envVars['TESTING_MODE'] !== 'false') {
  envVars['TESTING_MODE'] = 'false';
  updated = true;
  console.log('Updated TESTING_MODE to false');
}

if (!updated) {
  console.log('Environment already configured for production mode. No changes needed.');
  process.exit(0);
}

// Convert back to string
let newEnvContent = '';
for (const [key, value] of Object.entries(envVars)) {
  newEnvContent += `${key}=${value}\n`;
}

// Write updated content back to .env.local
fs.writeFileSync(envFilePath, newEnvContent);
console.log('Updated .env.local file with production settings.');
console.log('Restart your application for changes to take effect:');
console.log('npm run build && npm run start');