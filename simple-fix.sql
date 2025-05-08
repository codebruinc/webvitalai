-- Simple fix for the foreign key constraint error
-- This script first creates the user in the appropriate table, then adds the subscription

-- Check which table the foreign key references
SELECT
  tc.table_schema, 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_name = 'subscriptions_user_id_fkey';

-- Create the user in the appropriate table
-- Option 1: If the foreign key references auth.users
INSERT INTO auth.users (id, email, created_at, updated_at)
VALUES (
  '8ff0950a-c73d-4efc-8b73-56205b8035e0',
  'test@example.com', -- Replace with actual email if known
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING; -- Skip if user already exists

-- Option 2: If the foreign key references public.users
INSERT INTO public.users (id, email, created_at, updated_at)
VALUES (
  '8ff0950a-c73d-4efc-8b73-56205b8035e0',
  'test@example.com', -- Replace with actual email if known
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING; -- Skip if user already exists

-- Now create the subscription
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
)
ON CONFLICT (user_id) DO UPDATE SET
  plan_type = 'premium',
  status = 'active',
  current_period_end = NOW() + INTERVAL '1 year',
  cancel_at_period_end = FALSE,
  updated_at = NOW();

-- Verify the subscription was created/updated
SELECT * FROM public.subscriptions WHERE user_id = '8ff0950a-c73d-4efc-8b73-56205b8035e0';