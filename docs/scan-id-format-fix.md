# Scan ID Format Fix

## Issue
On the dashboard, the "View Results" button was appending "default" to the URL string for scans that were recently completed and saved in the database. This was happening because the code was using a fallback pattern that could trigger even for valid scans.

## Root Cause
The issue was in the `DashboardContent.tsx` file where the "View Results" button's onClick handler was using a fallback pattern:

```tsx
onClick={() => handleViewResults((website.latest_scan || createDefaultScan(website)).id)}
```

This would use the default scan ID (which includes "default-" prefix) even when a real scan existed but wasn't properly detected.

## Fix
The fix modifies the onClick handler to explicitly check for the existence of a real scan ID and only use that:

```tsx
onClick={() => {
  // Only use the actual scan ID from the database, not the default one
  const scanId = website.latest_scan ? website.latest_scan.id : null;
  if (scanId) {
    handleViewResults(scanId);
  } else {
    console.warn('No valid scan ID found for website:', website.url);
  }
}}
```

This ensures that:
1. Only real scan IDs from the database are used
2. The "default-" prefix is never appended to URLs for completed scans
3. A warning is logged if no valid scan ID is found

## Implementation
The fix was implemented by modifying the `src/components/dashboard/DashboardContent.tsx` file to change the onClick handler for the "View Results" button.

## Verification
To verify the fix:
1. Run the application
2. Complete a scan for a website
3. Go to the dashboard
4. Click the "View Results" button
5. Check that the URL does not contain "default" but instead has the correct UUID

## Related Files
- `src/components/dashboard/DashboardContent.tsx` - Modified to fix the View Results button
- `scripts/fix-scan-id-format.cjs` - Script to apply the fix
- `scripts/test-scan-id-format-fix.cjs` - Script to test the fix
- `docs/scan-id-format-fix.md` - This documentation file
