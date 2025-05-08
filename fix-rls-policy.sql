-- Fix for the RLS policy issue preventing scan creation
-- This script adds the necessary RLS policies for the scans table

-- Start a transaction so we can roll back if anything fails
BEGIN;

-- First, check if RLS is enabled for the scans table
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT obj_description('public.scans'::regclass)::jsonb->'security_policies'->'enabled' INTO rls_enabled;
  
  IF rls_enabled IS NULL THEN
    RAISE NOTICE 'Could not determine if RLS is enabled for scans table, assuming it is enabled';
  ELSIF NOT rls_enabled THEN
    RAISE NOTICE 'RLS is not enabled for scans table, enabling it now';
    ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
  ELSE
    RAISE NOTICE 'RLS is already enabled for scans table';
  END IF;
END $$;

-- Check if policies already exist for the scans table
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'scans' AND schemaname = 'public';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '% policies already exist for scans table', policy_count;
  ELSE
    RAISE NOTICE 'No policies found for scans table, creating them now';
  END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can insert scans for their websites" ON public.scans;
DROP POLICY IF EXISTS "Users can update their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can delete their own scans" ON public.scans;
DROP POLICY IF EXISTS "Service role can manage all scans" ON public.scans;

-- Create policy to allow users to view their own scans
-- This joins scans to websites to check if the user owns the website
CREATE POLICY "Users can view their own scans" ON public.scans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
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
  );

-- Create policy to allow service role to manage all scans
CREATE POLICY "Service role can manage all scans" ON public.scans
  USING (auth.role() = 'service_role');

-- Verify the policies were created
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

-- If everything looks good, commit the transaction
COMMIT;