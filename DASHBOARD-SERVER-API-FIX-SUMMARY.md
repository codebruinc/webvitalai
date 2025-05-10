# Dashboard Server API Fix Summary

## Issue
The dashboard page was not showing scan metrics and the "View Results" button was missing for completed scans, while the reports page was working correctly.

## Root Cause
The dashboard was using the Supabase service role client directly in the browser to fetch scan data and metrics, which was not properly bypassing RLS policies. The reports page was working correctly because it was using a server-side API approach.

## Fix Implemented
1. Created new server-side API endpoints:
   - `/api/dashboard` - Fetches websites, scans, and metrics data using the service role key
   - `/api/websites/[id]` - Handles website deletion using the service role key

2. Updated the DashboardContent component to use the new API endpoints instead of directly querying Supabase.

3. Removed the complex scan and metrics fetching code from the client side.

## Benefits
- Proper architecture: Service role key only used on the server side
- Simplified code: Dashboard component is now simpler and more maintainable
- Consistent approach: Both dashboard and reports pages use the same pattern
- Improved performance: Fewer API calls
- Better error handling: Server-side errors properly handled

## Testing
1. Log in to the application
2. Navigate to the dashboard page
3. Verify that websites with completed scans show metrics
4. Verify that the "View Results" button appears for completed scans
5. Click the "View Results" button and verify that it navigates to the scan results page
6. Try deleting a website and verify that it works correctly

## Files Changed
- Created: `src/app/api/dashboard/route.ts`
- Created: `src/app/api/websites/[id]/route.ts`
- Updated: `src/components/dashboard/DashboardContent.tsx`
- Created: `docs/dashboard-server-api-fix.md`

See the detailed documentation in `docs/dashboard-server-api-fix.md` for more information.
