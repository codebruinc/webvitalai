# Dashboard "View Results" Button Fix

## Issue
The "View Results" button on the dashboard was not working. When clicked, nothing happened - no errors were displayed in the console, and the user was not redirected to the scan results page.

## Investigation
We added extensive debug logging throughout the application to trace the issue:

1. In the DashboardContent component to log when the button is clicked and what scan ID is being used
2. In the dashboard page component to log when it loads with a scan ID and when it fetches scan results
3. In the scan results API route to log when it's called and what scan ID is being used
4. In the getScanResults function to log the database queries and results

The investigation revealed that the issue was with the router navigation. The router.push() method was not causing a page reload or navigation when called with the scan ID parameter.

## Fix
The fix modifies the handleViewResults function in the DashboardContent component to use window.location.href instead of router.push(). This forces a hard navigation to the scan results page, ensuring that the page reloads with the new scan ID parameter.

```typescript
// Before
const handleViewResults = (scanId: string) => {
  router.push(`/dashboard?scan=${scanId}`);
};

// After
const handleViewResults = (scanId: string) => {
  console.log('handleViewResults called with scanId:', scanId);
  
  // Use window.location.href for a hard navigation
  const fullUrl = `/dashboard?scan=${encodeURIComponent(scanId)}`;
  window.location.href = fullUrl;
};
```

This change ensures that the page fully reloads with the new scan ID parameter, triggering the useEffect hook in the dashboard page component that fetches the scan results.

## Implementation
The fix was implemented by modifying the handleViewResults function in the src/components/dashboard/DashboardContent.tsx file.

## Verification
To verify the fix:
1. Run the application
2. Go to the dashboard
3. Click the "View Results" button for a completed scan
4. Verify that the scan results are displayed correctly

## Related Files
- `src/components/dashboard/DashboardContent.tsx` - Modified to fix the "View Results" button
- `src/app/dashboard/page.tsx` - Added debug logging to help diagnose the issue
- `src/app/api/scan/results/route.ts` - Added debug logging to help diagnose the issue
- `src/services/scanService.ts` - Added debug logging to help diagnose the issue
- `docs/dashboard-view-results-button-fix.md` - This documentation file