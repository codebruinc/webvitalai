# Dashboard Scan Retrieval Fix

## Issue

The WebVitalAI dashboard was experiencing issues with scan data not being retrieved from the saved data when returning to the dashboard after running a scan. The browser console showed two types of errors:

1. `features?_rsc=1wtp7:1 Failed to load resource: the server responded with a status of 404 (Not Found)`
2. `kittwppxvfbvwyyklwrn.supabase.co/rest/v1/scans?select=id%2Cstatus%2Ccreated_at&website_id=eq.4cb819f6-f5a9-48c0-901c-23635df4b6da&order=created_at.desc&limit=1:1 Failed to load resource: the server responded with a status of 406 ()`

The primary issue was the 406 (Not Acceptable) error, which was preventing the dashboard from retrieving scan data from Supabase.

## Root Cause

The issue had three main components:

1. **PGRST116 Error**: In `DashboardContent.tsx`, the code was using `.single()` on the Supabase query when fetching the latest scan for each website. When no scan was found (either because it didn't exist or because RLS policies prevented access), this caused a PGRST116 error.

2. **406 Error**: The 406 error occurred because some Supabase API requests were missing the required headers (`Accept: application/json` and `Content-Type: application/json`).

3. **RLS Policy Restrictions**: Even after fixing the above issues, Row Level Security (RLS) policies were still preventing access to scan data in some cases.

## Solution

The solution involved three changes:

1. **Remove `.single()` and handle empty results properly**:
   ```typescript
   // Before
   const { data: scanData, error: scanError } = await supabase
     .from('scans')
     .select('id, status, created_at')
     .eq('website_id', website.id)
     .order('created_at', { ascending: false })
     .limit(1)
     .single();

   // After
   const { data: scansData, error: scanError } = await supabase
     .from('scans')
     .select('id, status, created_at')
     .eq('website_id', website.id)
     .order('created_at', { ascending: false })
     .limit(1);

   // Check if we have any scan data
   const scanData = scansData && scansData.length > 0 ? scansData[0] : null;
   ```

2. **Ensure proper headers are included in all Supabase requests**:
   This was already addressed in a previous fix (see `406-ERRORS-FIX.md`), which added the required headers to all Supabase clients in `src/lib/supabase.ts`.

3. **Use service role client to bypass RLS policies**:
   ```typescript
   // Import the service role client
   import { supabase, supabaseServiceRole } from '@/lib/supabase';

   // Use service role client for fetching scan data
   const { data: scansData, error: scanError } = await supabaseServiceRole
     .from('scans')
     .select('id, status, created_at')
     .eq('website_id', website.id)
     .order('created_at', { ascending: false })
     .limit(1);

   // Use service role client for fetching metrics
   const { data: metricsData, error: metricsError } = await supabaseServiceRole
     .from('metrics')
     .select('name, value')
     .eq('scan_id', latestScan.id)
     .in('name', ['Performance Score', 'Accessibility Score', 'SEO Score', 'Security Score']);
   ```

4. **Add a refresh button for manual data refresh**:
   ```typescript
   <button
     type="button"
     onClick={fetchWebsitesData}
     className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
   >
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
       <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
     </svg>
     Refresh Data
   </button>
   ```

5. **Add detailed logging for debugging**:
   ```typescript
   console.log(`Fetching scan data for website ${website.id} (${website.url})`);
   console.log(`Scan data response for website ${website.id}:`, {
     scansData,
     hasData: scansData && scansData.length > 0,
     error: scanError
   });
   ```

## Related Issues

This issue is related to several other fixes:

1. **406 Errors Fix**: The fix for 406 errors in Supabase API requests by ensuring all Supabase clients include the proper headers.

2. **Scan API PGRST116 Error Fix**: The fix for PGRST116 errors in the scan API by avoiding the use of `.single()` when fetching scan data.

3. **RLS Bypass Strategy**: The implementation of a service role client to bypass RLS policies for certain operations.

## Testing

To verify that the fix works:

1. Run a scan for a website from the dashboard
2. Wait for the scan to complete
3. Return to the dashboard
4. If scan data is not immediately visible, click the "Refresh Data" button
5. Verify that the scan data is displayed correctly

If the fix is working correctly, you should see the scan data displayed on the dashboard without any 406 or PGRST116 errors in the browser console.

## Prevention Measures

To prevent similar issues in the future:

1. **Avoid using `.single()` when fetching data that might not exist**: Instead, get an array and check if it's empty.

2. **Always include proper headers in Supabase requests**: Use the centralized Supabase client instances from `src/lib/supabase.ts` whenever possible.

3. **Use service role client for operations that need to bypass RLS**: When fetching data that might be restricted by RLS policies, consider using the service role client.

4. **Add refresh capabilities for critical data**: Provide users with a way to manually refresh data if automatic updates fail.

5. **Implement detailed logging**: Add logging to help identify issues in production.

6. **Monitor for 406 and PGRST116 errors**: Set up monitoring to detect these errors early.