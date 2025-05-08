-- Direct SQL fix for adding premium subscription
-- Run this in the Supabase SQL Editor

-- This script will add a premium subscription for user ID: 8ff0950a-c73d-4efc-8b73-56205b8035e0
-- It handles both cases: creating a new subscription or updating an existing one

DO $$
DECLARE
  user_exists BOOLEAN;
  subscription_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = '8ff0950a-c73d-4efc-8b73-56205b8035e0'
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID 8ff0950a-c73d-4efc-8b73-56205b8035e0 does not exist';
  END IF;
  
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
JOIN 
  auth.users u ON s.user_id = u.id
WHERE 
  s.user_id = '8ff0950a-c73d-4efc-8b73-56205b8035e0';