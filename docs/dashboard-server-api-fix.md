# Dashboard Server API Fix

## Problem

The dashboard page was not showing scan metrics and the "View Results" button was missing for completed scans, while the reports page was working correctly. This was happening because:

1. The dashboard was using a mixed approach for data fetching:
   - Using the regular Supabase client to get user session and fetch websites
   - Using the service role client directly in the browser to fetch scan data and metrics

2. The reports page was working correctly because it was using a server-side API approach that properly bypassed RLS policies.

## Solution

We implemented a server-side API approach for the dashboard similar to what was working for the reports page:

1. Created a new API endpoint (`/api/dashboard`) that:
   - Uses the service role key on the server side to bypass RLS policies
   - Fetches websites, scans, and metrics data in a single request
   - Returns the data in the format expected by the dashboard component

2. Updated the `DashboardContent.tsx` component to:
   - Use the new API endpoint instead of directly querying Supabase
   - Simplify the data fetching logic
   - Remove the complex scan and metrics fetching code

3. Created a new API endpoint (`/api/websites/[id]`) for deleting websites to maintain the server-side approach.

## Benefits

1. **Proper Architecture**: The service role key is now only used on the server side, not in the browser, which is more secure.
2. **Simplified Code**: The dashboard component is now simpler and more maintainable.
3. **Consistent Approach**: Both the dashboard and reports pages now use the same server-side API approach.
4. **Improved Performance**: Fetching all data in a single request reduces the number of API calls.
5. **Better Error Handling**: Server-side errors are properly caught and returned to the client.

## Files Changed

1. Created new API endpoints:
   - `src/app/api/dashboard/route.ts`
   - `src/app/api/websites/[id]/route.ts`

2. Updated components:
   - `src/components/dashboard/DashboardContent.tsx`

## Testing

To verify the fix:

1. Log in to the application
2. Navigate to the dashboard page
3. Verify that websites with completed scans show metrics
4. Verify that the "View Results" button appears for completed scans
5. Click the "View Results" button and verify that it navigates to the scan results page
6. Try deleting a website and verify that it works correctly

## Related Issues

This fix addresses the same architectural issue that was fixed for the reports page in a previous update. The reports page was updated to use a server-side API approach on [2025-05-09], and this fix applies the same pattern to the dashboard page.
