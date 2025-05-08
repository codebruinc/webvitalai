/**
 * Script to apply RLS policy fixes for metrics and issues tables
 * This script uses the Supabase JavaScript client to execute SQL commands
 */

const fs = require('fs');
const path = require('path');
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

console.log(`\n${colors.bold}${colors.cyan}WebVitalAI Metrics & Issues RLS Policy Fix (Supabase Client)${colors.reset}\n`);

// Check if @supabase/supabase-js module is installed
try {
  require.resolve('@supabase/supabase-js');
} catch (e) {
  console.log(`${colors.yellow}Installing required dependencies...${colors.reset}`);
  try {
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
    console.log(`${colors.green}Successfully installed @supabase/supabase-js module${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to install @supabase/supabase-js module. Please install it manually:${colors.reset}`);
    console.error(`npm install @supabase/supabase-js`);
    process.exit(1);
  }
}

// Import Supabase client after ensuring it's installed
const { createClient } = require('@supabase/supabase-js');

// Check if the SQL file exists
const sqlFilePath = path.join(process.cwd(), 'fix-metrics-issues-rls.sql');
if (!fs.existsSync(sqlFilePath)) {
  console.error(`${colors.red}Error: SQL file not found at ${sqlFilePath}${colors.reset}`);
  process.exit(1);
}

// Get Supabase URL and service role key from environment
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If not available in environment, try to read from .env.local
if (!supabaseUrl || !supabaseServiceRoleKey) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        if (line.trim().startsWith('#') || line.trim() === '') continue;
        
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          
          if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
          if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceRoleKey = value;
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error reading .env.local file:${colors.reset}`, error);
  }
}

// Check if we have the required Supabase credentials
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(`${colors.red}Error: Supabase URL and service role key are required${colors.reset}`);
  console.error(`${colors.yellow}Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables${colors.reset}`);
  process.exit(1);
}

// Read the SQL file
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Extract the project reference from the Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error(`${colors.red}Error: Could not extract project reference from Supabase URL${colors.reset}`);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Split SQL content into individual statements
// This is a simple approach and might not work for all SQL statements
// For complex SQL, consider using a proper SQL parser
function splitSqlStatements(sql) {
  // Remove comments
  const noComments = sql.replace(/--.*$/gm, '');
  
  // Split by semicolons, but ignore semicolons inside quotes or parentheses
  const statements = [];
  let currentStatement = '';
  let inQuote = false;
  let quoteChar = '';
  let parenthesesLevel = 0;
  
  for (let i = 0; i < noComments.length; i++) {
    const char = noComments[i];
    const nextChar = noComments[i + 1] || '';
    
    // Handle quotes
    if ((char === "'" || char === '"') && noComments[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    }
    
    // Handle parentheses
    if (!inQuote) {
      if (char === '(') {
        parenthesesLevel++;
      } else if (char === ')') {
        parenthesesLevel--;
      }
    }
    
    // Handle semicolons
    if (char === ';' && !inQuote && parenthesesLevel === 0) {
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      currentStatement = '';
    } else {
      currentStatement += char;
    }
  }
  
  // Add the last statement if there is one
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements;
}

async function applyRLSFixes() {
  try {
    console.log(`${colors.blue}Applying RLS policy fixes for metrics and issues tables...${colors.reset}`);
    
    // Split SQL into individual statements
    const statements = splitSqlStatements(sqlContent);
    
    // Execute each statement
    for (const statement of statements) {
      // Skip empty statements and verification queries
      if (!statement.trim() || 
          statement.toLowerCase().includes('select') && 
          statement.toLowerCase().includes('pg_policies')) {
        continue;
      }
      
      try {
        // Execute the SQL statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`${colors.yellow}Warning executing SQL:${colors.reset}`, error.message);
          console.error(`${colors.yellow}Statement:${colors.reset} ${statement.substring(0, 100)}...`);
        }
      } catch (stmtError) {
        console.error(`${colors.yellow}Error executing statement:${colors.reset}`, stmtError.message);
        console.error(`${colors.yellow}Statement:${colors.reset} ${statement.substring(0, 100)}...`);
      }
    }
    
    // Verify the policies were created
    console.log(`\n${colors.blue}Verifying metrics table policies:${colors.reset}`);
    const { data: metricsData, error: metricsError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'metrics' AND schemaname = 'public'` 
    });
    
    if (metricsError) {
      console.error(`${colors.yellow}Error verifying metrics policies:${colors.reset}`, metricsError.message);
    } else if (metricsData && metricsData.length > 0) {
      metricsData.forEach(row => {
        console.log(`  ${colors.green}✓ ${row.policyname} (${row.cmd})${colors.reset}`);
      });
    } else {
      console.log(`  ${colors.yellow}No policies found for metrics table${colors.reset}`);
    }
    
    console.log(`\n${colors.blue}Verifying issues table policies:${colors.reset}`);
    const { data: issuesData, error: issuesError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'issues' AND schemaname = 'public'` 
    });
    
    if (issuesError) {
      console.error(`${colors.yellow}Error verifying issues policies:${colors.reset}`, issuesError.message);
    } else if (issuesData && issuesData.length > 0) {
      issuesData.forEach(row => {
        console.log(`  ${colors.green}✓ ${row.policyname} (${row.cmd})${colors.reset}`);
      });
    } else {
      console.log(`  ${colors.yellow}No policies found for issues table${colors.reset}`);
    }
    
    console.log(`\n${colors.green}${colors.bold}✓ RLS policy fixes applied successfully!${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}Error:${colors.reset}`, error.message);
    console.error(`\n${colors.yellow}Alternative method: You can manually apply the SQL fixes by:${colors.reset}`);
    console.error(`1. Go to the Supabase dashboard: https://app.supabase.com/project/${projectRef}/sql`);
    console.error(`2. Copy the contents of fix-metrics-issues-rls.sql`);
    console.error(`3. Paste and execute the SQL in the Supabase SQL editor`);
    
    // Check if exec_sql function exists
    try {
      const { error: fnError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
      if (fnError && fnError.message.includes('function exec_sql(sql) does not exist')) {
        console.error(`\n${colors.red}Error: The exec_sql function does not exist in your Supabase project.${colors.reset}`);
        console.error(`${colors.yellow}Please use the apply-metrics-issues-fix.cjs script instead, which uses a direct PostgreSQL connection.${colors.reset}`);
      }
    } catch (fnCheckError) {
      // Ignore error checking for function
    }
    
    process.exit(1);
  }
}

// Run the async function
applyRLSFixes()
  .then(() => {
    console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
    console.log(`1. Restart your application: ${colors.cyan}npm run build && npm run start${colors.reset}`);
    console.log(`2. Test the scan functionality again`);
  })
  .catch(err => {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, err);
    process.exit(1);
  });