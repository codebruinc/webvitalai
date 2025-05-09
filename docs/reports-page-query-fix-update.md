# Reports Page Query Fix - Update

## Issue
The reports page was experiencing multiple issues:

1. A 400 Bad Request error when trying to fetch scans from Supabase with the error:
   ```
   "failed to parse order (scans.created_at.desc)" (line 1, column 7)
   unexpected "c" expecting "asc", "desc", "nullsfirst" or "nullslast"
   ```

2. Multiple GoTrueClient instances warning:
   ```
   Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.
   ```

3. No scans showing up on the reports page despite users being authenticated and having run scans in the past.

4. Service role key not being set, causing fallback to admin client:
   ```
   SUPABASE_SERVICE_ROLE_KEY is not set. Using admin client as fallback. Some operations requiring service role permissions may fail.
   ```

## Root Causes

1. **Incorrect Ordering Syntax**: The query was using an incorrect syntax for ordering nested fields in Supabase. The `.order('scans.created_at', { ascending: false })` syntax is not supported for nested fields.

2. **Multiple Supabase Client Instances**: The Supabase client was being created multiple times in the browser context, potentially causing authentication issues.

3. **Missing Service Role Key**: The service role key was not set, causing the service role client to fall back to the admin client, which might not have the necessary permissions to bypass RLS policies.

4. **Potential RLS Policy Issues**: Row-level security policies might be preventing users from seeing their scans.

## Solution

1. **Fixed Ordering Syntax**:
   - Removed the problematic order by 'scans.created_at' in the regular client approach
   - Added client-side sorting of scans by created_at date after fetching the data
   - Used a simpler ordering by website URL instead

2. **Implemented Singleton Pattern for Supabase Client**:
   - Modified `src/lib/supabase.ts` to use a singleton pattern for the client component client
   - This ensures only one GoTrueClient instance is created in the browser context

3. **Enhanced Query Strategy**:
   - Added a direct query to check if the user has any websites
   - Added a third approach that directly queries the scans table as a last resort
   - Added more detailed logging to help diagnose issues
   - Improved error handling and TypeScript typing

4. **Added Diagnostic Tool**:
   - Created a script (`scripts/check-user-scans.cjs`) to check if scans are properly associated with a user's UUID in the database
   - This helps diagnose if the issue is with the query or with the data itself

## Implementation Details

### 1. Fixed Ordering Syntax in Reports Page

```typescript
// Before
.order('scans.created_at', { ascending: false });

// After
.order('url'); // Order by website URL as a fallback

// Added client-side sorting
regularClientResult.data?.forEach((website: any) => {
  if (website.scans && Array.isArray(website.scans) && website.scans.length > 1) {
    website.scans.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
});
```

### 2. Implemented Singleton Pattern for Supabase Client

```typescript
// Before
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

// After
let clientInstance: any = null;

export const supabase = typeof window !== 'undefined'
  ? (() => {
      if (!clientInstance) {
        clientInstance = createClientComponentClient({
          supabaseUrl,
          supabaseKey: supabaseAnonKey,
          options: {
            global: {
              headers: defaultHeaders
            }
          }
        });
      }
      return clientInstance;
    })()
  : supabaseAdmin;
```

### 3. Enhanced Query Strategy

Added a third approach that directly queries the scans table:

```typescript
// Direct query to the scans table as a last resort
const directScansResult = await supabaseServiceRole
  .from('scans')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);
```

Added more detailed logging:

```typescript
console.log('Service role result:', {
  hasError: !!serviceRoleResult.error,
  errorCode: serviceRoleResult.error?.code,
  errorMessage: serviceRoleResult.error?.message,
  dataLength: serviceRoleResult.data?.length || 0
});
```

### 4. Added Diagnostic Tool

Created a comprehensive script to check if scans are properly associated with a user's UUID:

```javascript
// scripts/check-user-scans.cjs
// This script checks:
// 1. If the user exists
// 2. If the user has any websites
// 3. If the websites have any scans
// 4. If the reports page queries return the expected results
// 5. If RLS policies are properly configured
```

## Testing

To test the fix:

1. Run the diagnostic script to check if scans are properly associated with the user:
   ```
   node scripts/check-user-scans.cjs
   ```

2. Check the browser console for detailed logs when loading the reports page.

3. Verify that the reports page shows the expected scans.

## Related Files

- `src/app/reports/page.tsx` - Main file that was modified to fix the query issues
- `src/lib/supabase.ts` - Modified to implement the singleton pattern for the Supabase client
- `scripts/check-user-scans.cjs` - Diagnostic script to check user scans
- `scripts/fix-reports-page-query.cjs` - Script to apply the fix

## Additional Recommendations

1. **Set the Service Role Key**: Ensure that the `SUPABASE_SERVICE_ROLE_KEY` environment variable is properly set to allow the service role client to bypass RLS policies.

2. **Check RLS Policies**: Verify that the RLS policies for the scans and websites tables are correctly configured to allow users to see their own data.

3. **Verify Scan Creation**: Ensure that when a user runs a scan, it is properly associated with their user ID through the website's user_id field.

4. **Monitor for Errors**: Keep an eye on the browser console for any errors or warnings related to Supabase queries or authentication.