-- Fix for the RLS policy issues with metrics and issues tables
-- This script adds the necessary RLS policies for the metrics and issues tables

-- Start a transaction so we can roll back if anything fails
BEGIN;

-- First, check if RLS is enabled for the metrics table
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT obj_description('public.metrics'::regclass)::jsonb->'security_policies'->'enabled' INTO rls_enabled;
  
  IF rls_enabled IS NULL THEN
    RAISE NOTICE 'Could not determine if RLS is enabled for metrics table, assuming it is enabled';
  ELSIF NOT rls_enabled THEN
    RAISE NOTICE 'RLS is not enabled for metrics table, enabling it now';
    ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
  ELSE
    RAISE NOTICE 'RLS is already enabled for metrics table';
  END IF;
END $$;

-- Check if RLS is enabled for the issues table
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT obj_description('public.issues'::regclass)::jsonb->'security_policies'->'enabled' INTO rls_enabled;
  
  IF rls_enabled IS NULL THEN
    RAISE NOTICE 'Could not determine if RLS is enabled for issues table, assuming it is enabled';
  ELSIF NOT rls_enabled THEN
    RAISE NOTICE 'RLS is not enabled for issues table, enabling it now';
    ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
  ELSE
    RAISE NOTICE 'RLS is already enabled for issues table';
  END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.metrics;
DROP POLICY IF EXISTS "Users can insert metrics for their scans" ON public.metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON public.metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON public.metrics;
DROP POLICY IF EXISTS "Service role can manage all metrics" ON public.metrics;

DROP POLICY IF EXISTS "Users can view their own issues" ON public.issues;
DROP POLICY IF EXISTS "Users can insert issues for their scans" ON public.issues;
DROP POLICY IF EXISTS "Users can update their own issues" ON public.issues;
DROP POLICY IF EXISTS "Users can delete their own issues" ON public.issues;
DROP POLICY IF EXISTS "Service role can manage all issues" ON public.issues;

-- Create policies for metrics table

-- Create policy to allow users to view their own metrics
-- This joins metrics to scans to websites to check if the user owns the website
CREATE POLICY "Users can view their own metrics" ON public.metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.websites ON websites.id = scans.website_id
      WHERE scans.id = metrics.scan_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert metrics for scans they own
CREATE POLICY "Users can insert metrics for their scans" ON public.metrics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.websites ON websites.id = scans.website_id
      WHERE scans.id = metrics.scan_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create policy to allow users to update their own metrics
CREATE POLICY "Users can update their own metrics" ON public.metrics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.websites ON websites.id = scans.website_id
      WHERE scans.id = metrics.scan_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete their own metrics
CREATE POLICY "Users can delete their own metrics" ON public.metrics
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.websites ON websites.id = scans.website_id
      WHERE scans.id = metrics.scan_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create policy to allow service role to manage all metrics
CREATE POLICY "Service role can manage all metrics" ON public.metrics
  USING (auth.role() = 'service_role');

-- Create policies for issues table

-- Create policy to allow users to view their own issues
-- This joins issues to scans to websites to check if the user owns the website
CREATE POLICY "Users can view their own issues" ON public.issues
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.websites ON websites.id = scans.website_id
      WHERE scans.id = issues.scan_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert issues for scans they own
CREATE POLICY "Users can insert issues for their scans" ON public.issues
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.websites ON websites.id = scans.website_id
      WHERE scans.id = issues.scan_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create policy to allow users to update their own issues
CREATE POLICY "Users can update their own issues" ON public.issues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.websites ON websites.id = scans.website_id
      WHERE scans.id = issues.scan_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete their own issues
CREATE POLICY "Users can delete their own issues" ON public.issues
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.websites ON websites.id = scans.website_id
      WHERE scans.id = issues.scan_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create policy to allow service role to manage all issues
CREATE POLICY "Service role can manage all issues" ON public.issues
  USING (auth.role() = 'service_role');

-- Verify the policies were created for metrics
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
  tablename = 'metrics' 
  AND schemaname = 'public';

-- Verify the policies were created for issues
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
  tablename = 'issues' 
  AND schemaname = 'public';

-- If everything looks good, commit the transaction
COMMIT;