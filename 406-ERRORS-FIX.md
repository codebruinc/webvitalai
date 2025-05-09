# 406 Errors Fix Documentation

## Issue Description

The WebVitalAI dashboard was experiencing 406 (Not Acceptable) errors when making API requests to the Supabase backend. These errors prevented the dashboard from displaying past scan results correctly, showing "No scans yet" for websites that had been previously scanned.

### Error Pattern

The browser console showed multiple 406 (Not Acceptable) errors with patterns like:

```
kittwppxvfbvwyyklwrn.supabase.co/rest/v1/scans?select=id%2Cstatus%2Ccreated_at&website_id=eq.03b9d8d3-bf49-4db5-830b-cfa4c12ba5fb&order=created_at.desc&limit=1:1 Failed to load resource: the server responded with a status of 406 ()
```

### Affected API Endpoints

The 406 errors affected multiple Supabase REST API endpoints, including:

- `/rest/v1/scans` - Used to fetch scan history and results
- `/rest/v1/websites` - Used to fetch website information
- `/rest/v1/metrics` - Used to fetch performance metrics
- `/rest/v1/issues` - Used to fetch detected issues

### What is a 406 (Not Acceptable) Error?

A 406 (Not Acceptable) status code indicates that the server cannot produce a response matching the list of acceptable values defined in the request's headers, particularly the `Accept` header. In the context of REST APIs:

- The client specifies what content types it can accept via the `Accept` header
- The server checks if it can provide content in one of those formats
- If not, it responds with a 406 status code

For Supabase REST API specifically, it requires clients to explicitly state that they accept JSON responses via the `Accept: application/json` header. Without this header, the server refuses to process the request, resulting in a 406 error.

## Root Cause Analysis

The root cause of the 406 errors was the absence of required HTTP headers in Supabase API requests:

1. **Missing Headers**:
   - `Accept: application/json` - Tells the server that the client expects JSON responses
   - `Content-Type: application/json` - Specifies that the request body is in JSON format

2. **Where Headers Were Missing**:
   - In the global Supabase client configuration in `src/lib/supabase.ts`
   - In temporary Supabase client instances created directly in `src/app/api/scan/route.ts`
   - In fetch requests in `src/app/dashboard/page.tsx`

3. **Why These Headers Are Required**:
   - The Supabase REST API strictly enforces content negotiation
   - The `Accept` header is required to tell Supabase that the client can handle JSON responses
   - The `Content-Type` header is required for POST/PUT requests to indicate that the request body is JSON
   - Without these headers, Supabase returns a 406 error instead of processing the request

This issue was particularly problematic because:
- Some Supabase client instances had the headers while others didn't
- The error only occurred in certain API calls, making it difficult to diagnose
- The default Supabase client configuration doesn't automatically include these headers

## Solution Implemented

The solution involved adding the required headers to all Supabase client instances throughout the application:

### 1. Global Supabase Client Configuration

Modified `src/lib/supabase.ts` to include default headers for all Supabase clients:

```typescript
// Default headers for all clients
const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Create a standard client for server-side usage with anon key
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: defaultHeaders
  }
});

// Create a service role client that bypasses RLS
export const supabaseServiceRole = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: defaultHeaders
      }
    })
  : supabaseAdmin;

// For client components
export const supabase = typeof window !== 'undefined'
  ? createClientComponentClient({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
      options: {
        global: {
          headers: defaultHeaders
        }
      }
    })
  : supabaseAdmin;
```

### 2. Temporary Supabase Client Instances

Updated `src/app/api/scan/route.ts` to include the required headers in all temporary Supabase client instances:

**Before:**
```typescript
// Create a temporary Supabase client with the token for authentication only
const tempClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    global: {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  }
);
```

**After:**
```typescript
// Create a temporary Supabase client with the token for authentication only
const tempClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  }
);
```

Similar changes were made to all other temporary client instances in the file, including those in the GET endpoint handler.

### 3. Dashboard Page Fetch Requests

Updated `src/app/dashboard/page.tsx` to include proper headers in fetch requests:

```typescript
// Add headers for API requests
const headers: HeadersInit = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

if (isDevelopment) {
  headers['x-testing-bypass'] = 'true';
}
```

## Verification

The fix was verified using the following methods:

1. **Browser Console Monitoring**:
   - Before the fix: Multiple 406 errors appeared in the console
   - After the fix: No 406 errors in the console when accessing the dashboard

2. **Dashboard Functionality Testing**:
   - Before the fix: Dashboard showed "No scans yet" for websites that had been scanned
   - After the fix: Dashboard correctly displayed scan history and results

3. **API Endpoint Testing**:
   - Manual testing of API endpoints using tools like Postman or curl
   - Example curl command to test the scan API endpoint:
     ```bash
     curl -X GET "http://localhost:3000/api/scan?id=YOUR_SCAN_ID" \
       -H "Accept: application/json" \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer YOUR_TOKEN"
     ```

4. **Network Tab Inspection**:
   - Using browser developer tools to inspect network requests
   - Confirming that all requests to Supabase include the proper headers
   - Verifying that responses have 200 status codes instead of 406

## Prevention Measures

To prevent similar issues in the future, the following best practices are recommended:

1. **Consistent Header Usage**:
   - Always include `Accept: application/json` and `Content-Type: application/json` headers in all API requests
   - Use the centralized Supabase client instances from `src/lib/supabase.ts` whenever possible
   - If creating temporary clients, ensure they include the required headers

2. **Header Configuration Helper**:
   - Consider creating a helper function to generate consistent header configurations:
     ```typescript
     function getSupabaseHeaders(additionalHeaders = {}) {
       return {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
         ...additionalHeaders
       };
     }
     ```

3. **API Request Wrapper**:
   - Implement a wrapper function for API requests that automatically includes the required headers
   - This ensures consistency across all API calls, even those made outside of the Supabase client

4. **Monitoring and Logging**:
   - Add monitoring for 406 errors specifically
   - Log detailed information about API requests that result in errors
   - Set up alerts for unexpected 406 responses

5. **Documentation**:
   - Document the requirement for these headers in the project's API documentation
   - Include examples of correct API usage in developer guides
   - Add comments in code where temporary clients are created to remind developers about header requirements

By implementing these prevention measures, the application will be more resilient against similar issues in the future, ensuring a smoother user experience and reducing debugging time for developers.