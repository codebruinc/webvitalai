-- SQL script to add premium subscription for user ID: 203c71f3-49f7-450d-85b9-a2ff110facc6
-- This user ID was provided by the user and should already exist in the database

-- Start a transaction so we can roll back if anything fails
BEGIN;

-- First, verify the user exists
DO $$
DECLARE
  user_exists BOOLEAN;
  user_email TEXT;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = '203c71f3-49f7-450d-85b9-a2ff110facc6'
  ) INTO user_exists;
  
  IF user_exists THEN
    -- Get the user's email for confirmation
    SELECT email INTO user_email FROM auth.users WHERE id = '203c71f3-49f7-450d-85b9-a2ff110facc6';
    RAISE NOTICE 'User found in auth.users with email: %', user_email;
  ELSE
    -- Check if user exists in public.users as a fallback
    SELECT EXISTS(
      SELECT 1 FROM public.users 
      WHERE id = '203c71f3-49f7-450d-85b9-a2ff110facc6'
    ) INTO user_exists;
    
    IF user_exists THEN
      -- Try to get the user's email if available
      BEGIN
        SELECT email INTO user_email FROM public.users WHERE id = '203c71f3-49f7-450d-85b9-a2ff110facc6';
        RAISE NOTICE 'User found in public.users with email: %', user_email;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'User found in public.users but could not retrieve email';
      END;
    ELSE
      RAISE EXCEPTION 'User with ID 203c71f3-49f7-450d-85b9-a2ff110facc6 not found in either auth.users or public.users';
    END IF;
  END IF;
END $$;

-- Now check if the subscription already exists
DO $$
DECLARE
  subscription_exists BOOLEAN;
BEGIN
  -- Check if subscription exists
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = '203c71f3-49f7-450d-85b9-a2ff110facc6'
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
    WHERE user_id = '203c71f3-49f7-450d-85b9-a2ff110facc6';
    
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
      '203c71f3-49f7-450d-85b9-a2ff110facc6',
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

-- Verify the subscription was created/updated
SELECT 
  s.id, 
  s.user_id, 
  s.plan_type, 
  s.status, 
  s.current_period_end,
  u.email
FROM 
  public.subscriptions s
LEFT JOIN 
  auth.users u ON s.user_id = u.id
WHERE 
  s.user_id = '203c71f3-49f7-450d-85b9-a2ff110facc6';

-- If everything looks good, commit the transaction
COMMIT;