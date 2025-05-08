# WebVitalAI: RLS Policy Fix Implementation Guide

This guide provides comprehensive instructions for fixing the Row-Level Security (RLS) policy issue in the WebVitalAI application that is preventing scan creation.

## Understanding the Issue

The WebVitalAI application is experiencing an issue where users cannot create new website scans. This is caused by missing Row-Level Security (RLS) policies in the Supabase database. RLS policies control which database rows a user can access, and without proper policies, users cannot insert new scan records even for their own websites.

The issue specifically affects:
- The "analyze website" functionality on the home screen
- The scan creation API endpoint
- Any feature that attempts to create new scan records

## Prerequisites

Before applying the fix, ensure you have:

1. **Node.js**: Version 16.x or higher
2. **npm packages**: The following packages must be installed:
   ```bash
   npm install @supabase/supabase-js dotenv node-fetch
   ```
3. **Supabase credentials**: Your `.env.local` file must contain:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Production mode**: The application should be in production mode with `NODE_ENV=production` and `TESTING_MODE=false`
5. **Database access**: Your Supabase service role key must have permissions to modify RLS policies

## Step-by-Step Fix Instructions

### 1. Apply the Comprehensive Fix

The easiest way to apply the fix is to use the provided shell script:

```bash
# Make the script executable
chmod +x apply-comprehensive-fix.sh

# Run the script
./apply-comprehensive-fix.sh
```

This script will:
- Verify your environment configuration
- Fix authentication issues
- Apply the RLS policy fix
- Ensure users have premium subscriptions
- Rebuild the application
- Test the fix end-to-end

### 2. Verify the Fix with the Test Script

After applying the fix, you can verify it's working correctly by running:

```bash
node test-comprehensive-fix.js
```

This test script will:
- Test the authentication flow
- Verify RLS policies are working correctly
- Run an end-to-end test of the scan creation process
- Provide a detailed report of test results

### 3. Restart the Application

After applying the fix, restart your application:

```bash
npm run build
npm run start
```

### 4. Verify in the Production Environment

To verify the fix is working in the production environment:

1. Log in to your WebVitalAI application
2. Navigate to the home screen
3. Enter a URL in the "Analyze Website" form
4. Submit the form and verify that:
   - The scan is created successfully
   - You're redirected to the dashboard
   - Scan results appear after processing completes

## Understanding the Fix

The fix implements the following RLS policies for the `scans` table:

1. **Users can view their own scans**: Users can only see scans for websites they own
2. **Users can insert scans for their websites**: Users can only create scans for websites they own
3. **Users can update their own scans**: Users can only update scans for websites they own
4. **Users can delete their own scans**: Users can only delete scans for websites they own
5. **Service role can manage all scans**: The service role bypasses RLS for administrative purposes

These policies ensure that:
- Users can only access their own data
- The application's service role can perform necessary operations
- Security is maintained while allowing proper functionality

## Troubleshooting

If you encounter issues after applying the fix:

### Issue: "Permission denied" errors when creating scans

**Possible causes:**
- RLS policies were not applied correctly
- User is not authenticated properly
- User is trying to create a scan for a website they don't own

**Solutions:**
1. Run `node fix-authentication.js` to verify authentication is working
2. Run `node comprehensive-rls-fix.js` to reapply the RLS policies
3. Check that the website belongs to the current user

### Issue: "Foreign key constraint" errors

**Possible causes:**
- The website record doesn't exist
- The user doesn't have a valid subscription

**Solutions:**
1. Run `node update-user-subscription.js` to ensure the user has a premium subscription
2. Verify the website exists in the database

### Issue: Application still in testing mode

**Possible causes:**
- Environment variables not updated
- Application not rebuilt after changes

**Solutions:**
1. Run `node set-production-mode.js` to update environment variables
2. Run `npm run build` to rebuild the application
3. Restart the application with `npm run start`

### Issue: Test script fails

**Possible causes:**
- API server not running
- Database connection issues
- Incorrect environment variables

**Solutions:**
1. Ensure the application is running on http://localhost:3000
2. Check your Supabase credentials in `.env.local`
3. Verify network connectivity to Supabase

## Additional Resources

For more detailed information, refer to:

- `docs/comprehensive-fix.md`: Detailed explanation of the fix
- `docs/rls-policy-fix.md`: Technical details of the RLS policies
- `docs/database_migration_guide.md`: Guide for database migrations

## Support

If you continue to experience issues after applying the fix, please contact support with:
- The output from `apply-comprehensive-fix.sh`
- The test results from `test-comprehensive-fix.js`
- Your application logs