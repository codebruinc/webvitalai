-- Comprehensive fix for creating both user and subscription
-- This script handles the case where the user doesn't exist in the users table

-- Start a transaction so we can roll back if anything fails
BEGIN;

-- First, check which schema the users table is in
DO $$
DECLARE
  user_table_exists BOOLEAN;
  auth_user_exists BOOLEAN;
  public_user_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) INTO auth_user_exists;
  
  -- Check if user exists in public.users
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO public_user_exists;
  
  IF auth_user_exists THEN
    RAISE NOTICE 'Found users table in auth schema';
  END IF;
  
  IF public_user_exists THEN
    RAISE NOTICE 'Found users table in public schema';
  END IF;
  
  IF NOT auth_user_exists AND NOT public_user_exists THEN
    RAISE EXCEPTION 'Could not find users table in either auth or public schema';
  END IF;
END $$;

-- Create the user in public.users if it doesn't exist
-- This is likely needed based on the error message
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists in public.users
  SELECT EXISTS(
    SELECT 1 FROM public.users 
    WHERE id = '8ff0950a-c73d-4efc-8b73-56205b8035e0'
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE NOTICE 'User does not exist in public.users, creating it now';
    
    -- Insert the user into public.users
    -- Note: Adjust the columns as needed based on your actual schema
    INSERT INTO public.users (
      id,
      email,
      created_at,
      updated_at
    ) VALUES (
      '8ff0950a-c73d-4efc-8b73-56205b8035e0',
      'test@example.com', -- Replace with actual email if known
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created user in public.users table';
  ELSE
    RAISE NOTICE 'User already exists in public.users table';
  END IF;
END $$;

-- Now check if the subscription exists and create/update it
DO $$
DECLARE
  subscription_exists BOOLEAN;
BEGIN
  -- Check if subscription exists
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = '8ff0950a-c73d-4efc-8b73-56205b8035e0'
  ) INTO subscription_exists;
  
  IF subscription_exists THEN
    -- Update existing subscription
    UPDATE public.subscriptions
    SET 
      plan_type = 'premium',
      status = 'active',
      current_period_end = NOW() + INTERVAL '1 year',
      cancel_at_period_end = FALSE,
      updated_at = NOW()
    WHERE user_id = '8ff0950a-c73d-4efc-8b73-56205b8035e0';
    
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
      '8ff0950a-c73d-4efc-8b73-56205b8035e0',
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

-- Verify the user was created
SELECT * FROM public.users WHERE id = '8ff0950a-c73d-4efc-8b73-56205b8035e0';

-- Verify the subscription was created/updated
SELECT * FROM public.subscriptions WHERE user_id = '8ff0950a-c73d-4efc-8b73-56205b8035e0';

-- If everything looks good, commit the transaction
COMMIT;