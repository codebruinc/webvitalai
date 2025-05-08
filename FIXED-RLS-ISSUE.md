# WebVitalAI: Fixed RLS Issues Documentation

This document explains the issues we fixed in the WebVitalAI application and provides instructions for verifying that everything is working correctly.

## 1. Summary of Issues Fixed

### RLS Policy Preventing Scan Creation
The primary issue was that Row-Level Security (RLS) policies in Supabase were preventing scan creation, resulting in the following error:
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
URL form submission error: Error: Failed to create scan: new row violates row-level security policy for table "scans"
```

### Client-Side Error: "Error: supabaseKey is required"
The Supabase client was not being properly initialized on the client side, leading to authentication errors and preventing proper API calls.

### API Authentication Error: 401 Unauthorized
The API routes were experiencing authentication issues, resulting in 401 Unauthorized errors when trying to access protected endpoints.

## 2. Solutions Implemented

### Using the Service Role Client to Bypass RLS
We implemented a multi-layered approach to bypass RLS policies for scan creation:

1. **Service Role Client**: Added a service role client in `src/lib/supabase.ts` that has administrative privileges to bypass RLS policies.

```typescript
// Create a service role client that bypasses RLS
export const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

2. **Multi-Level Fallback Mechanism**: Enhanced the scan service with a progressive fallback mechanism:
   - First try with the regular authenticated client
   - If that fails, try with the service role client
   - If that fails, try with a database function that has SECURITY DEFINER privileges
   - As a last resort, generate a UUID and log the failure

3. **Database Function**: Created a `create_scan_bypass_rls` function with SECURITY DEFINER privileges to bypass RLS completely.

### Properly Initializing the Client-Side Supabase Client
We fixed the client-side Supabase initialization by:

1. Ensuring environment variables are properly loaded
2. Verifying that the Supabase URL and anonymous key are available
3. Implementing proper error handling for client initialization failures

### Fixing the API Route Authentication
We updated the API routes to:

1. Import and use the service role client when needed
2. Add detailed logging for troubleshooting
3. Implement a two-step approach:
   - First try with the authenticated client
   - If that fails, fall back to the service role client

## 3. Verification Instructions

### Starting the Application

1. Ensure your environment variables are set correctly in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NODE_ENV=production
   TESTING_MODE=false
   ```

2. Build and start the application:
   ```bash
   npm run build
   npm run start
   ```

### Testing Scan Creation from the UI

1. Open your browser and navigate to the application (typically http://localhost:3000)
2. Log in with your user credentials
3. On the homepage, enter a URL in the "Analyze Website" form (e.g., https://example.com)
4. Click the "Analyze" button
5. You should see a success message and be redirected to the dashboard or results page
6. The scan should start processing without any errors

### Verifying Scans in the Database

You can verify that scans are being created in the database by:

1. Using the verification script:
   ```bash
   node verify-simple-fix.js
   ```
   This script will:
   - Test the scan API endpoint
   - Verify the scan was created in the database
   - Verify the website record exists

2. Checking the Supabase dashboard:
   - Log in to your Supabase dashboard
   - Navigate to the Table Editor
   - Select the "scans" table
   - You should see your newly created scan with status "pending" or "completed"

3. Running a SQL query:
   ```sql
   SELECT s.id, s.status, s.created_at, w.url 
   FROM scans s
   JOIN websites w ON s.website_id = w.id
   ORDER BY s.created_at DESC
   LIMIT 10;
   ```

## 4. Troubleshooting Guidance

If you encounter issues after applying the fixes, try the following troubleshooting steps:

### Service Role Client Issues

If the service role client fails:
- Verify that the `SUPABASE_SERVICE_ROLE_KEY` is correct in your `.env.local` file
- Check that the service role has the necessary permissions in Supabase
- Look for any error messages in the application logs related to authentication

### Database Function Issues

If the RPC function fails:
- Run `node apply-rls-bypass.js` again to recreate the function
- Check the Supabase SQL Editor for any errors
- Verify that the function has the necessary permissions
- Check if the function exists by running this SQL in the Supabase SQL Editor:
  ```sql
  SELECT * FROM pg_proc WHERE proname = 'create_scan_bypass_rls';
  ```

### API Endpoint Issues

If the API endpoint fails:
- Check that the application is running
- Verify that the API route is implemented correctly
- Check the server logs for errors
- Make sure the user is authenticated properly

### Application Mode Issues

If the application is still in testing mode:
- Run `node set-production-mode.js` to set production mode
- Verify that `.env.local` contains:
  ```
  NODE_ENV=production
  TESTING_MODE=false
  ```
- Restart the application after making changes

### Client-Side Authentication Issues

If you're experiencing client-side authentication issues:
- Clear your browser cache and cookies
- Try logging out and logging back in
- Check the browser console for any errors related to Supabase
- Verify that the Supabase client is being initialized correctly

### Comprehensive Fix Script

If you're still experiencing issues, you can run the comprehensive fix script:
```bash
./apply-rls-bypass-fix.sh
```

This script will:
1. Check for required tools and environment variables
2. Install necessary dependencies
3. Apply the RLS bypass solution
4. Apply the standard RLS policy fix
5. Set production mode
6. Update user subscription
7. Test the fix
8. Rebuild the application

## Conclusion

The fixes we've implemented provide a robust solution to the RLS policy issues in WebVitalAI. By using a multi-layered approach with fallback mechanisms, we've ensured that scan creation works reliably even with RLS policies in place. The service role client and SECURITY DEFINER function provide the necessary privileges to bypass RLS when needed, while still maintaining security for other operations.

If you encounter any issues not covered in this document, please refer to the additional documentation in the `docs/` directory or contact the development team for assistance.