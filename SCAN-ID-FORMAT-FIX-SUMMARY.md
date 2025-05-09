# Scan ID Format Fix Summary

## Issue
On the dashboard, the "View Results" button was appending "default" to the URL string for scans that were recently completed and saved in the database.

## Fix
The fix ensures that only real scan IDs from the database are used, and the "default-" prefix is never appended to URLs for completed scans.

## Implementation
- Modified `src/components/dashboard/DashboardContent.tsx` to fix the View Results button
- Created `scripts/fix-scan-id-format.cjs` to apply the fix
- Created `scripts/test-scan-id-format-fix.cjs` to test the fix
- Added documentation in `docs/scan-id-format-fix.md`

## Verification
To verify the fix:
1. Run the application
2. Complete a scan for a website
3. Go to the dashboard
4. Click the "View Results" button
5. Check that the URL does not contain "default" but instead has the correct UUID

For detailed information, see `docs/scan-id-format-fix.md`.
