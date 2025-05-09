# Scan API PGRST116 Error Fix

## Issue

The WebVitalAI application was encountering `PGRST116` errors when fetching scan results. The error message was:

```
Error fetching scan: {
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  hint: null,
  message: 'JSON object requested, multiple (or no) rows returned'
}
```

This error occurred even though the scan was successfully created and processed (as indicated by logs showing "Scan completed successfully").

## Root Cause

The issue was in the `GET` endpoint of `src/app/api/scan/route.ts`. When fetching a scan, the code was using `.single()` on the Supabase query:

```typescript
const { data: scan, error: scanError } = await supabase
  .from('scans')
  .select('id, status, error, completed_at, website_id, websites(user_id)')
  .eq('id', scanId)
  .single();
```

When the Row Level Security (RLS) policy prevented the authenticated user from accessing the scan record, the query returned 0 rows. The `.single()` method then threw the `PGRST116` error because it expects exactly one row.

## Solution

The solution was to modify the `GET` endpoint to avoid using `.single()` and to handle the case where 0 rows are returned more gracefully:

```typescript
// Get the scan data - avoid using .single() to prevent PGRST116 errors when 0 rows are returned
const { data: scans, error: scanError } = await supabase
  .from('scans')
  .select('id, status, error, completed_at, website_id, websites(user_id)')
  .eq('id', scanId); // Removed .single()

if (scanError) {
  console.error('API GET /api/scan: Database error while fetching scan:', scanError);
  return NextResponse.json(
    { error: 'Failed to retrieve scan data due to a database error.' },
    { status: 500 }
  );
}

if (!scans || scans.length === 0) {
  // This case handles both "not found" and "access denied by RLS"
  console.log(`API GET /api/scan: No scan found for ID ${scanId} (could be RLS policy preventing access)`);
  return NextResponse.json(
    { error: 'Scan not found or access denied.' }, 
    { status: 404 }
  );
}

// Log if multiple scans are found for the same ID, which shouldn't happen.
if (scans.length > 1) {
    console.warn(`API GET /api/scan: Multiple scans found for ID ${scanId}. Using the first one.`);
}

const scan = scans[0]; // Proceed with the first record
```

This change ensures that:
1. If the database query fails, we return a 500 error with a clear message
2. If no scans are found (either because the scan doesn't exist or because RLS prevents access), we return a 404 error with a clear message
3. If multiple scans are found (which shouldn't happen), we log a warning and proceed with the first one

## Related Issues

This issue is related to the RLS policies for the `scans` table. The fact that the scan is created successfully but can't be accessed by the user suggests that the RLS policies might need to be reviewed.

A typical RLS policy for the `scans` table would allow a user to read scans associated with websites they own:

```sql
CREATE POLICY "Users can read their own scans" ON scans
  FOR SELECT
  USING (
    website_id IN (
      SELECT id FROM websites
      WHERE user_id = auth.uid()
    )
  );
```

If this policy is missing or incorrectly configured, users might not be able to access their scans.

## Testing

To verify that the fix works:
1. Create a scan using the `POST /api/scan` endpoint
2. Wait for the scan to complete
3. Fetch the scan using the `GET /api/scan?id=<scanId>` endpoint

If the fix is working correctly, you should either:
- Get a successful response with the scan data (if the user has access to the scan)
- Get a 404 error with the message "Scan not found or access denied." (if the user doesn't have access to the scan)

But you should no longer see the `PGRST116` error.
