-- Direct RLS Policy Fix for WebVitalAI
-- This script directly fixes the RLS policy issue for the scans table
-- Run this in the Supabase SQL Editor

-- Start a transaction so we can roll back if anything fails
BEGIN;

-- Step 1: Enable RLS for the scans table if not already enabled
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can insert scans for their websites" ON public.scans;
DROP POLICY IF EXISTS "Users can update their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can delete their own scans" ON public.scans;
DROP POLICY IF EXISTS "Service role can manage all scans" ON public.scans;
DROP POLICY IF EXISTS "Allow all access to scans" ON public.scans;

-- Step 3: Create a temporary policy to allow all access (for testing)
-- This will help determine if the issue is with RLS or something else
CREATE POLICY "Allow all access to scans" ON public.scans
  USING (true)
  WITH CHECK (true);

-- Step 4: Test if the temporary policy works
-- If this works, then the issue is with the RLS policy
-- If this doesn't work, then the issue is elsewhere
DO $$
DECLARE
  test_website_id UUID;
  test_scan_id UUID;
BEGIN
  -- Create a test website if needed
  INSERT INTO public.websites (url, name, is_active, user_id)
  VALUES ('https://test-example.com', 'Test Website', true, auth.uid())
  RETURNING id INTO test_website_id;
  
  -- Try to create a test scan
  INSERT INTO public.scans (website_id, status)
  VALUES (test_website_id, 'test')
  RETURNING id INTO test_scan_id;
  
  -- If we get here, the temporary policy works
  RAISE NOTICE 'Temporary policy works! Created test scan with ID: %', test_scan_id;
  
  -- Clean up the test data
  DELETE FROM public.scans WHERE id = test_scan_id;
  DELETE FROM public.websites WHERE id = test_website_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error testing temporary policy: %', SQLERRM;
    -- Don't rethrow the exception, continue with the script
END $$;

-- Step 5: Drop the temporary policy
DROP POLICY IF EXISTS "Allow all access to scans" ON public.scans;

-- Step 6: Create the proper RLS policies
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

-- Step 7: Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies 
WHERE 
  tablename = 'scans' 
  AND schemaname = 'public';

-- Step 8: Test the auth.uid() function
DO $$
BEGIN
  RAISE NOTICE 'Current auth.uid(): %', auth.uid();
  RAISE NOTICE 'Current auth.role(): %', auth.role();
END $$;

-- If everything looks good, commit the transaction
COMMIT;