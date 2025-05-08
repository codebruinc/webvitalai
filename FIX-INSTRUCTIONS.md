# WebVitalAI Fix Instructions

This guide will help you fix the issues with test data appearing in your WebVitalAI application and set up a premium user account.

## Problem 1: Application Running in Test Mode

The application is currently showing test data because it's running in development/testing mode instead of production mode.

### Solution: Set Production Mode

Run the following script to update your environment variables:

```bash
node set-production-mode.js
```

This script will:
- Create or update your `.env.local` file
- Set `NODE_ENV=production`
- Set `TESTING_MODE=false`

After running the script, restart your application:

```bash
npm run build
npm run start
```

## Problem 2: User Missing Premium Subscription

You're getting a foreign key constraint error when trying to add a subscription record for user ID: `8ff0950a-c73d-4efc-8b73-56205b8035e0`.

### Solution 1: Using JavaScript (Recommended)

Run the following script to add a premium subscription for the user:

```bash
# First install dependencies if needed
npm install @supabase/supabase-js dotenv

# Then run the script
node update-user-subscription.js
```

This script will:
- Check if the user exists
- Create or update a premium subscription for the user
- Set the subscription to active with a 1-year expiration

### Solution 2: Using SQL in Supabase Dashboard

If the JavaScript approach doesn't work, you can run SQL directly:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `update-subscription.sql`
4. Run the SQL script

## Verifying the Fix

After applying both fixes:

1. Restart your application
2. Log in with the user account
3. Run a new scan
4. Verify that:
   - You're seeing real scan results (not test data)
   - You have access to all premium features

## Troubleshooting

If you're still experiencing issues:

### Check Environment Variables

Make sure your `.env.local` file contains:

```
NODE_ENV=production
TESTING_MODE=false
```

### Check User Subscription

Run this SQL query in the Supabase SQL Editor to verify the user's subscription:

```sql
SELECT 
  u.email, 
  s.plan_type, 
  s.status, 
  s.current_period_end
FROM 
  subscriptions s
JOIN 
  auth.users u ON s.user_id = u.id
WHERE 
  s.user_id = '8ff0950a-c73d-4efc-8b73-56205b8035e0';
```

You should see a row with `plan_type` set to `premium` and `status` set to `active`.

### Check Application Logs

Look for any mentions of "TESTING MODE" in your application logs, which would indicate the app is still running in testing mode.

### Clear Browser Cache

Try clearing your browser cache and cookies, then log in again to ensure you're getting fresh data.