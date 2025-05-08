# RLS Bypass Solution Verification

This document explains how to verify the RLS bypass solution implemented for the WebVitalAI application.

## Background

The WebVitalAI application uses Row-Level Security (RLS) policies in Supabase to secure data access. However, there were issues with scan creation due to RLS policies blocking legitimate operations. To address this, a multi-level fallback mechanism was implemented:

1. First attempt: Use the regular client
2. Second attempt: Use the service role client
3. Third attempt: Use a custom database function that bypasses RLS

## Verification Script

The `verify-rls-bypass-fix.js` script tests all three methods of scan creation and verifies that the solution works correctly.

### What the Script Tests

1. **Regular Client**: Attempts to create a scan using the regular Supabase client (may fail if RLS policies are in place)
2. **Service Role Client**: Attempts to create a scan using the service role client (should bypass RLS)
3. **RPC Function**: Attempts to create a scan using the `create_scan_bypass_rls` database function (should bypass RLS)
4. **API Endpoint**: Tests the end-to-end flow by simulating a form submission to `/api/scan`

For each successful scan creation, the script verifies that the scan was actually created in the database.

### Prerequisites

Before running the script, make sure you have:

1. Set up the Supabase project with the correct RLS policies
2. Created the `create_scan_bypass_rls` database function (using `apply-rls-bypass.js`)
3. Configured the environment variables with the following:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_BASE_URL` (defaults to `http://localhost:3000` if not set)

   You can use either:
   - `.env.local` - Your production environment configuration
   - `.env.test` - A test environment configuration (recommended for testing)

### Running the Script

1. Make sure the WebVitalAI application is running (for API endpoint tests)
2. Run the script:

```bash
# Make the script executable (if not already)
chmod +x verify-rls-bypass-fix.js

# Run the script with the test environment
./verify-rls-bypass-fix.js
```

> **Note**: The script will try to load environment variables from `.env.test` first, then fall back to `.env.local`. For local testing, it's recommended to use `.env.test` with `NEXT_PUBLIC_BASE_URL=http://localhost:3000`.

### Interpreting Results

The script provides detailed logging of each step and clear success/failure indicators. At the end, it displays a summary of the results:

- **Regular Client**: May fail if RLS policies are in place (this is expected)
- **Service Role Client**: Should succeed (bypassing RLS)
- **RPC Function**: Should succeed (bypassing RLS)
- **API Endpoint**: Should succeed (using one of the fallback methods)

The overall result is considered PASSED if at least one of the critical methods (Service Role Client, RPC Function, or API Endpoint) succeeds.

### Troubleshooting

If the verification fails, check the following:

1. **Service Role Client Fails**:
   - Verify that the service role key is correct
   - Check that the service role has the necessary permissions

2. **RPC Function Fails**:
   - Verify that the database function was created correctly
   - Check that the function has the necessary permissions
   - Run `apply-rls-bypass.js` again to recreate the function

3. **API Endpoint Fails**:
   - Check that the application is running
   - Verify that the API route is implemented correctly
   - Check the server logs for errors

## Related Files

- `src/lib/supabase.ts`: Contains the service role client implementation
- `src/services/scanService.ts`: Contains the multi-level fallback mechanism
- `src/app/api/scan/route.ts`: Contains the enhanced API route
- `create-scan-bypass-rls.sql`: Contains the database function definition
- `apply-rls-bypass.js`: Script to create the database function
- `test-scan-rls-bypass.js`: Basic test script for the RLS bypass solution
- `apply-rls-bypass-fix.sh`: Shell script to apply all fixes

## Conclusion

The RLS bypass solution provides a robust mechanism for scan creation, ensuring that legitimate operations are not blocked by RLS policies. The verification script helps confirm that all components of the solution are working correctly.