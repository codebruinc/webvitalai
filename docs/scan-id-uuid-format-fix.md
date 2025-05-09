# Scan ID UUID Format Fix

## Issue
After implementing the scan ID format fix to prevent "default-" prefixed IDs from being used in the "View Results" button, a new issue emerged: the "View Results" button stopped working completely. No errors were displayed, but clicking the button did nothing.

## Root Cause
The issue was in the API routes (`src/app/api/scan/results/route.ts` and `src/app/api/scan/status/route.ts`) where there was a strict validation check that rejected any scan ID with a "default-" prefix with a 400 error. This validation was added as part of a previous fix to prevent invalid scan IDs from being processed.

However, this validation was conflicting with the recent fix in `DashboardContent.tsx` that was supposed to prevent "default-" prefixed IDs from being used in the first place. The button's onClick handler was correctly checking for valid scan IDs, but if any scan ID with a "default-" prefix somehow made it to the API, it would be rejected with an error.

## Fix
The fix modifies the API routes to log a warning instead of returning an error when a scan ID with a "default-" prefix is encountered:

```typescript
// Before
if (scanId.startsWith('default-')) {
  console.error(`Invalid scan ID format: ${scanId} - IDs with "default-" prefix are not valid UUIDs`);
  return NextResponse.json(
    { error: 'Invalid scan ID format. IDs with "default-" prefix are not supported in production.' },
    { status: 400 }
  );
}

// After
if (scanId.startsWith('default-')) {
  console.warn(`Warning: Scan ID has default- prefix: ${scanId}`);
}
```

This change allows the request to proceed to the service layer, where the `getScanResults` function already has proper handling for scan IDs with a "default-" prefix.

## Implementation
The fix was implemented by modifying:
1. `src/app/api/scan/results/route.ts` - Changed error response to warning log
2. `src/app/api/scan/status/route.ts` - Changed error response to warning log

## Verification
To verify the fix:
1. Run the application
2. Go to the dashboard
3. Click the "View Results" button for a completed scan
4. Verify that the scan results are displayed correctly

## Related Files
- `src/app/api/scan/results/route.ts` - Modified to log warning instead of returning error
- `src/app/api/scan/status/route.ts` - Modified to log warning instead of returning error
- `docs/scan-id-format-fix.md` - Previous fix documentation
- `docs/scan-id-uuid-format-fix.md` - This documentation file