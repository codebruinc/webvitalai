-- Targeted fix for the specific foreign key constraint error
-- This script will:
-- 1. Identify which table is referenced by the subscriptions_user_id_fkey constraint
-- 2. Create the user in that specific table
-- 3. Add the premium subscription

-- Start a transaction so we can roll back if anything fails
BEGIN;

-- Step 1: Identify the referenced table for the foreign key constraint
DO $$
DECLARE
  referenced_table TEXT;
  referenced_schema TEXT;
BEGIN
  SELECT
    ccu.table_schema,
    ccu.table_name
  INTO
    referenced_schema,
    referenced_table
  FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_name = 'subscriptions_user_id_fkey'
  LIMIT 1;

  IF referenced_table IS NULL THEN
    RAISE EXCEPTION 'Could not find the referenced table for subscriptions_user_id_fkey constraint';
  END IF;

  RAISE NOTICE 'Foreign key references table %.%', referenced_schema, referenced_table;
  
  -- Step 2: Create the user in the referenced table
  IF referenced_schema = 'auth' AND referenced_table = 'users' THEN
    -- Create user in auth.users
    RAISE NOTICE 'Creating user in auth.users table';
    
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '8ff0950a-c73d-4efc-8b73-56205b8035e0') THEN
      -- Insert into auth.users - adjust columns as needed for your schema
      EXECUTE 'INSERT INTO auth.users (id, email, created_at, updated_at) VALUES 
        (''8ff0950a-c73d-4efc-8b73-56205b8035e0'', ''test@example.com'', NOW(), NOW())';
      RAISE NOTICE 'User created in auth.users';
    ELSE
      RAISE NOTICE 'User already exists in auth.users';
    END IF;
  ELSIF referenced_schema = 'public' AND referenced_table = 'users' THEN
    -- Create user in public.users
    RAISE NOTICE 'Creating user in public.users table';
    
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '8ff0950a-c73d-4efc-8b73-56205b8035e0') THEN
      -- Insert into public.users - adjust columns as needed for your schema
      EXECUTE 'INSERT INTO public.users (id, email, created_at, updated_at) VALUES 
        (''8ff0950a-c73d-4efc-8b73-56205b8035e0'', ''test@example.com'', NOW(), NOW())';
      RAISE NOTICE 'User created in public.users';
    ELSE
      RAISE NOTICE 'User already exists in public.users';
    END IF;
  ELSE
    -- Handle other schemas/tables if needed
    RAISE NOTICE 'Unexpected referenced table: %.%', referenced_schema, referenced_table;
    RAISE EXCEPTION 'Cannot automatically create user in %.%', referenced_schema, referenced_table;
  END IF;
END $$;

-- Step 3: Create or update the subscription
DO $$
BEGIN
  -- Check if subscription already exists
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = '8ff0950a-c73d-4efc-8b73-56205b8035e0') THEN
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
SELECT * FROM public.subscriptions WHERE user_id = '8ff0950a-c73d-4efc-8b73-56205b8035e0';

-- If everything looks good, commit the transaction
COMMIT;