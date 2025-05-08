# WebVitalAI RLS Policy Fix

This guide will help you fix the Row-Level Security (RLS) policy issue that's preventing scan creation in your WebVitalAI application.

## The Problem

You're encountering the following error when trying to create a scan:

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
URL form submission error: Error: Failed to create scan: new row violates row-level security policy for table "scans"
```

This error occurs because the Row-Level Security (RLS) policies for the `scans` table are either:
1. Not properly configured
2. Not correctly applied
3. Having issues with the `auth.uid()` function

## The Solution

We've created a comprehensive fix that will:

1. Check if RLS is enabled for the scans table
2. Check if the correct policies are applied
3. Apply the correct policies if needed
4. Test the fix by attempting to create a scan
5. Provide detailed error information if the fix fails

## How to Use the Fix

### Option 1: Using the Shell Script (Recommended)

1. Open your terminal
2. Navigate to your project directory
3. Run the following command:

```bash
./fix-rls-complete.sh
```

This script will:
- Install required dependencies
- Make the JavaScript fix script executable
- Run the comprehensive RLS policy fix
- Provide final instructions

### Option 2: Using the JavaScript Script Directly

If you prefer to run the JavaScript script directly:

1. Install the required dependencies:

```bash
npm install @supabase/supabase-js dotenv
```

2. Run the script:

```bash
node fix-rls-complete.js
```

### Option 3: Manual SQL Fix

If the automated scripts don't work, you can apply the fix manually:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix-rls-policy.sql`
4. Run the SQL script

## After Applying the Fix

After applying the fix:

1. Restart your application:

```bash
npm run build && npm run start
```

2. Log in with your user account
3. Try using the "analyze website" function from the home screen
4. Verify that scans can be created successfully

## Troubleshooting

If you're still experiencing issues after applying the fix:

### Check Environment Variables

Make sure your `.env.local` file contains:

```
NODE_ENV=production
TESTING_MODE=false
```

### Check User Authentication

Ensure you're properly authenticated when making scan requests. The RLS policy relies on `auth.uid()` to determine if you own the website you're trying to scan.

### Check Website Ownership

The RLS policy only allows you to create scans for websites that you own. Make sure the website you're trying to scan is associated with your user account.

### Check Database Schema

Ensure your database schema matches what the application expects:
- The `scans` table should have a `website_id` column that references the `websites` table
- The `websites` table should have a `user_id` column that references the user's ID

### Check Supabase Configuration

Make sure your Supabase project is properly configured:
- RLS is enabled for the `scans` table
- The correct policies are applied to the `scans` table
- The `auth.uid()` function is working correctly

## Need More Help?

If you're still experiencing issues, please check the detailed logs from the fix script for more information on what might be going wrong.