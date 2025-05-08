#!/usr/bin/env node

/**
 * This script applies RLS policy fixes for the metrics and issues tables
 * to resolve the "new row violates row-level security policy" errors.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Starting RLS policy fix for metrics and issues tables...');

// SQL to fix RLS policies for metrics and issues tables
const fixRlsSql = `
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

-- Create policy to allow service role to manage all metrics
CREATE POLICY "Service role can manage all metrics" ON public.metrics
  USING (auth.role() = 'service_role');

-- Create policy to allow service role to manage all issues
CREATE POLICY "Service role can manage all issues" ON public.issues
  USING (auth.role() = 'service_role');

-- Create policy to allow users to view their own metrics
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

-- Create policy to allow users to view their own issues
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
`;

async function applyRlsFix() {
  try {
    console.log('Applying RLS policy fix...');
    
    // First, ensure RLS is enabled for both tables
    console.log('Enabling RLS for metrics and issues tables...');
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE IF EXISTS public.metrics ENABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE IF EXISTS public.issues ENABLE ROW LEVEL SECURITY;' });
    
    // Apply the RLS policy fix
    console.log('Creating RLS policies...');
    const { error } = await supabase.rpc('exec_sql', { sql: fixRlsSql });
    
    if (error) {
      console.error('Error applying RLS fix:', error);
      
      // Alternative approach if exec_sql function doesn't exist
      console.log('Trying alternative approach with direct SQL execution...');
      
      // Split the SQL into individual statements
      const statements = fixRlsSql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const stmt of statements) {
        const { error } = await supabase.from('_sql').select('*').eq('query', stmt + ';');
        if (error) {
          console.error(`Error executing statement: ${stmt}`, error);
        }
      }
      
      // If that also fails, provide instructions for manual fix
      console.log('\nIf the automatic fix failed, please run the following SQL in the Supabase SQL Editor:');
      console.log('\n' + fixRlsSql);
      
      return false;
    }
    
    console.log('RLS policy fix applied successfully!');
    return true;
  } catch (error) {
    console.error('Error applying RLS fix:', error);
    return false;
  }
}

// Test the fix by trying to insert a test record
async function testFix() {
  try {
    console.log('\nTesting the fix...');
    
    // Get a test scan ID
    const { data: scans, error: scanError } = await supabase
      .from('scans')
      .select('id')
      .limit(1);
    
    if (scanError || !scans || scans.length === 0) {
      console.error('Could not find a test scan:', scanError);
      return false;
    }
    
    const testScanId = scans[0].id;
    
    // Try to insert a test metric
    const { data: metric, error: metricError } = await supabase
      .from('metrics')
      .insert({
        scan_id: testScanId,
        name: 'test_metric',
        value: 100,
        category: 'test'
      })
      .select();
    
    if (metricError) {
      console.error('Test insertion failed for metrics:', metricError);
      return false;
    }
    
    console.log('Successfully inserted test metric:', metric);
    
    // Try to insert a test issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        scan_id: testScanId,
        title: 'Test Issue',
        description: 'This is a test issue',
        severity: 'low',
        category: 'test'
      })
      .select();
    
    if (issueError) {
      console.error('Test insertion failed for issues:', issueError);
      return false;
    }
    
    console.log('Successfully inserted test issue:', issue);
    
    // Clean up test data
    await supabase.from('metrics').delete().eq('name', 'test_metric');
    await supabase.from('issues').delete().eq('title', 'Test Issue');
    
    return true;
  } catch (error) {
    console.error('Error testing the fix:', error);
    return false;
  }
}

// Main function
async function main() {
  const fixSuccess = await applyRlsFix();
  
  if (fixSuccess) {
    const testSuccess = await testFix();
    
    if (testSuccess) {
      console.log('\n✅ RLS policy fix has been successfully applied and tested!');
      console.log('You should now be able to create scans and store metrics and issues without RLS policy violations.');
    } else {
      console.log('\n⚠️ RLS policy fix was applied but testing failed.');
      console.log('You may need to check your database configuration or try the manual fix.');
    }
  } else {
    console.log('\n❌ Failed to apply RLS policy fix.');
    console.log('Please try the manual fix by running the SQL in the Supabase SQL Editor.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});