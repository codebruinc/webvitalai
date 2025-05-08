# RLS Policy Fix for Metrics and Issues Tables

This directory contains scripts to fix Row Level Security (RLS) policies for the metrics and issues tables in the WebVitalAI Supabase database. These fixes ensure that authenticated users with premium access can properly access their metrics and issues data.

## The Problem

When running the `fix-production-mode.cjs` script, it failed with the error:

```
unknown command "sql" for "supabase"
                                    
Did you mean this?                  
    sso                             
                                    
Try rerunning the command with --debug to troubleshoot the error.
```

This error occurs because the script is trying to use the Supabase CLI's `sql` command, which may not be available in older versions of the CLI or if the CLI is not properly installed.

## Solution

We've created multiple scripts that can apply the necessary RLS policy fixes using different methods. The main wrapper script will try each method in order until one succeeds.

### Scripts

1. **apply-rls-fix.js** - Main wrapper script that tries all methods in order
2. **apply-metrics-issues-cli.cjs** - Uses the Supabase CLI (installs/updates it if needed)
3. **apply-metrics-issues-fix.cjs** - Uses a direct PostgreSQL connection
4. **apply-metrics-issues-supabase.cjs** - Uses the Supabase JavaScript client
5. **apply-metrics-issues-manual.cjs** - Provides manual instructions for applying the SQL through the Supabase dashboard

### SQL File

- **fix-metrics-issues-rls.sql** - Contains the SQL statements to fix the RLS policies

## How to Use

### Option 1: Use the Wrapper Script (Recommended)

This script will try all methods in order until one succeeds:

```bash
node apply-rls-fix.js
```

### Option 2: Use the Supabase CLI Directly

This script will install or update the Supabase CLI if needed, then use it to apply the SQL:

```bash
node apply-metrics-issues-cli.cjs
```

### Option 3: Use a Direct PostgreSQL Connection

This script uses the `pg` module to connect directly to the PostgreSQL database:

```bash
node apply-metrics-issues-fix.cjs
```

### Option 4: Use the Supabase JavaScript Client

This script uses the Supabase JavaScript client to execute the SQL:

```bash
node apply-metrics-issues-supabase.cjs
```

### Option 5: Manual Application

This script provides instructions for manually applying the SQL through the Supabase dashboard:

```bash
node apply-metrics-issues-manual.cjs
```

## Requirements

- Node.js 14 or higher
- Access to the Supabase project (URL and service role key)

## Environment Variables

The scripts require the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - The URL of your Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` - The service role key for your Supabase project

These can be set in your environment or in a `.env.local` file in the project root.

## What the Fix Does

The SQL script:

1. Enables Row Level Security (RLS) on the metrics and issues tables if not already enabled
2. Drops any existing RLS policies for these tables to avoid conflicts
3. Creates new RLS policies that allow:
   - Users to view, insert, update, and delete their own metrics and issues
   - Service role to manage all metrics and issues
4. Verifies that the policies were created successfully

## After Applying the Fix

After successfully applying the RLS policy fixes:

1. Restart your application: `npm run build && npm run start`
2. Test the scan functionality again to ensure it's working properly

## Troubleshooting

If all automatic methods fail, the scripts will provide instructions for manually applying the SQL through the Supabase dashboard.

If you encounter any issues, check the Supabase logs for more details.