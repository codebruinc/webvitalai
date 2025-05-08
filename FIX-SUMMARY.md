# WebVitalAI Fix Summary

This document provides a summary of all the fix scripts available for resolving the RLS policy issue in WebVitalAI.

## The Problem

You're encountering the following error when trying to create a scan:

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
URL form submission error: Error: Failed to create scan: new row violates row-level security policy for table "scans"
```

This error occurs because the Row-Level Security (RLS) policies for the `scans` table are not properly configured or applied.

## Available Fix Scripts

### 1. Comprehensive Fix (Recommended)

**Script:** `./fix-all.sh`

This is the most comprehensive solution that addresses all potential issues:
- Sets the application to production mode
- Fixes RLS policies for the scans table
- Ensures the user has a premium subscription
- Tests the fix by creating a scan

Use this script if you want a complete solution that addresses all potential issues.

### 2. RLS Policy Fix

**Script:** `./fix-rls-complete.sh`

This script focuses specifically on fixing the RLS policy issue:
- Checks if RLS is enabled for the scans table
- Checks if the correct policies are applied
- Applies the correct policies if needed
- Tests the fix by attempting to create a scan

Use this script if you're confident that the issue is specifically with the RLS policies.

### 3. Diagnostic Tool

**Script:** `./diagnose-rls-issue.sh`

This script helps diagnose the issue without making any changes:
- Checks if RLS is enabled for the scans table
- Lists all existing policies for the scans table
- Checks the current user's authentication status
- Checks if the user owns any websites
- Tests creating a scan and reports any errors

Use this script if you want to understand the issue better before applying a fix.

### 4. Manual SQL Fix

**Script:** `direct-rls-fix.sql`

This is a SQL script that can be run directly in the Supabase dashboard:
- Enables RLS for the scans table
- Drops existing policies
- Creates a temporary policy to allow all access (for testing)
- Creates the proper RLS policies
- Tests the auth.uid() function

Use this script if you prefer to apply the fix manually through the Supabase dashboard.

### 5. Production Mode Setting

**Script:** `node set-production-mode.js`

This script sets the application to production mode:
- Creates or updates your `.env.local` file
- Sets `NODE_ENV=production`
- Sets `TESTING_MODE=false`

Use this script if you only need to set the application to production mode.

### 6. User Subscription Update

**Script:** `node update-user-subscription.js`

This script adds a premium subscription for the user:
- Checks if the user exists
- Creates or updates a premium subscription for the user
- Sets the subscription to active with a 1-year expiration

Use this script if you only need to update the user's subscription.

## Recommended Approach

1. First, run the diagnostic tool to understand the issue:
   ```
   ./diagnose-rls-issue.sh
   ```

2. Then, apply the comprehensive fix:
   ```
   ./fix-all.sh
   ```

3. Restart your application:
   ```
   npm run build && npm run start
   ```

4. If you're still experiencing issues, check the detailed logs and refer to the `RLS-FIX-README.md` file for more troubleshooting tips.

## Additional Resources

- `RLS-FIX-README.md`: Detailed guide on the RLS policy issue and how to fix it
- `FIX-INSTRUCTIONS.md`: Original instructions for fixing the application