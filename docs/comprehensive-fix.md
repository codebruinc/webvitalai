# Comprehensive Fix Guide for WebVitalAI

This guide provides a complete solution for fixing the issues with WebVitalAI, including the Row-Level Security (RLS) policy issue that's preventing scan creation.

## Understanding the Issues

There are three main issues that might be affecting your WebVitalAI application:

1. **Application Running in Test Mode**: The application might be showing test data because it's running in development/testing mode instead of production mode.

2. **RLS Policy Issue**: The Row-Level Security (RLS) policies for the `scans` table might be preventing the insertion of new rows.

3. **User Missing Premium Subscription**: The user might not have a premium subscription, which could be required for certain features.

## Quick Fix (Recommended)

For a comprehensive fix that addresses all potential issues, run the following script:

```bash
./fix-all.sh
```

This script will:
1. Set the application to production mode
2. Fix the RLS policies for the scans table
3. Ensure the user has a premium subscription
4. Test the fix by creating a scan

After running the script, restart your application:

```bash
npm run build && npm run start
```

## Manual Fix Steps

If you prefer to fix the issues manually or if the quick fix doesn't work, follow these steps:

### Step 1: Set Production Mode

1. Create or update your `.env.local` file with the following settings:

```
NODE_ENV=production
TESTING_MODE=false
```

2. Alternatively, run the following script:

```bash
node set-production-mode.js
```

### Step 2: Fix RLS Policies

1. Run the following SQL script in the Supabase dashboard:

```sql
-- Enable RLS for the scans table
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can insert scans for their websites" ON public.scans;
DROP POLICY IF EXISTS "Users can update their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can delete their own scans" ON public.scans;
DROP POLICY IF EXISTS "Service role can manage all scans" ON public.scans;

-- Create policy to allow users to view their own scans
CREATE POLICY "Users can view their own scans" ON public.scans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create policy to allow users to insert scans for websites they own
CREATE POLICY "Users can insert scans for their websites" ON public.scans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create policy to allow users to update their own scans
CREATE POLICY "Users can update their own scans" ON public.scans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create policy to allow users to delete their own scans
CREATE POLICY "Users can delete their own scans" ON public.scans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );
```

2. Alternatively, run the following script:

```bash
./fix-rls-complete.sh
```

### Step 3: Add Premium Subscription

1. Run the following SQL script in the Supabase dashboard:

```sql
-- Check if user exists
DO $$
DECLARE
  user_exists BOOLEAN;
  user_id UUID := auth.uid();
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', user_id;
  END IF;
  
  -- Check if subscription exists
  SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id = user_id) INTO user_exists;
  
  IF user_exists THEN
    -- Update existing subscription
    UPDATE public.subscriptions
    SET 
      plan_type = 'premium',
      status = 'active',
      current_period_end = NOW() + INTERVAL '1 year',
      cancel_at_period_end = FALSE,
      updated_at = NOW()
    WHERE user_id = user_id;
    
    RAISE NOTICE 'Updated existing subscription to premium';
  ELSE
    -- Insert new subscription
    INSERT INTO public.subscriptions (
      user_id,
      plan_type,
      status,
      stripe_customer_id,
      stripe_subscription_id,
      current_period_end,
      cancel_at_period_end,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      'premium',
      'active',
      'cus_manual_premium',
      'sub_manual_premium',
      NOW() + INTERVAL '1 year',
      FALSE,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created new premium subscription';
  END IF;
END $$;
```

2. Alternatively, run the following script:

```bash
node update-user-subscription.js
```

### Step 4: Restart the Application

After applying all the fixes, restart your application:

```bash
npm run build && npm run start
```

## Verifying the Fix

After applying the fixes:

1. Log in with your user account
2. Try using the "analyze website" function from the home screen
3. Verify that scans can be created successfully

## Troubleshooting

If you're still experiencing issues after applying the fixes:

### Diagnose the Issue

Run the diagnostic script to get more information about the issue:

```bash
./diagnose-rls-issue.sh
```

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

## Additional Resources

- `RLS-FIX-README.md`: Detailed guide on the RLS policy issue and how to fix it
- `FIX-SUMMARY.md`: Summary of all the fix scripts available
- `docs/rls-policy-fix.md`: Detailed explanation of RLS and how it works in Supabase
- `FIX-INSTRUCTIONS.md`: Original instructions for fixing the application

## Need More Help?

If you're still experiencing issues after trying all the fixes and troubleshooting steps, please check the detailed logs from the fix scripts for more information on what might be going wrong.