-- Create a function to bypass RLS when creating scans
-- This function will be called by the service role client as a last resort

-- Start a transaction
BEGIN;

-- Create or replace the function
CREATE OR REPLACE FUNCTION public.create_scan_bypass_rls(website_id_param UUID)
RETURNS TABLE(id UUID) 
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
DECLARE
  new_scan_id UUID;
BEGIN
  -- Insert the scan directly, bypassing RLS
  INSERT INTO public.scans (website_id, status)
  VALUES (website_id_param, 'pending')
  RETURNING id INTO new_scan_id;
  
  -- Return the new scan ID
  RETURN QUERY SELECT new_scan_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION public.create_scan_bypass_rls(UUID) TO service_role;

-- Commit the transaction
COMMIT;