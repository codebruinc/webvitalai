# Dashboard "View Results" Button Fix

## Issue
The "View Results" button on the dashboard was not working. When clicked, nothing happened - no errors were displayed in the console, and the user was not redirected to the scan results page. The dashboard page was logging "Dashboard page loaded with scanId: null" even though the scan ID was being passed in the URL.

## Root Cause
After investigating the issue, we identified several problems:

1. **URL Navigation**: The `handleViewResults` function in DashboardContent.tsx was using a relative URL without the origin, which can cause issues with Next.js client-side navigation.

2. **URL Parameter Handling**: The dashboard page component was not properly handling the scan ID parameter from the URL. The `useSearchParams()` hook in Next.js can sometimes have issues with client-side navigation.

3. **State Persistence**: The scan ID was not being stored in component state, so it wasn't persisting during component lifecycle events.

4. **Caching Issues**: API requests might have been cached, leading to stale data.

## Fix
The fix addresses these issues by:

1. **Using Absolute URLs**: Modified the `handleViewResults` function to use the full URL with origin to ensure proper navigation.

2. **Adding Fallback Navigation**: Added a timeout to check if navigation happened and try an alternative method if it failed.

3. **Storing Scan ID in State**: Added state management for the scan ID to ensure it persists during component lifecycle.

4. **Preventing Caching**: Added timestamps to API requests to prevent caching.

### Changes to DashboardContent.tsx
```typescript
// Before
const handleViewResults = (scanId: string) => {
  console.log('handleViewResults called with scanId:', scanId);
  
  if (!scanId || scanId.startsWith('default-')) {
    console.warn('Invalid scan ID:', scanId);
    return;
  }
  
  try {
    console.log('Using window.location.href for navigation');
    // Use the full URL to ensure proper navigation
    const fullUrl = `/dashboard?scan=${encodeURIComponent(scanId)}`;
    console.log('Navigating to:', fullUrl);
    
    // Force a hard navigation to ensure the page reloads
    window.location.href = fullUrl;
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

// After
const handleViewResults = (scanId: string) => {
  console.log('handleViewResults called with scanId:', scanId);
  
  if (!scanId || scanId.startsWith('default-')) {
    console.warn('Invalid scan ID:', scanId);
    return;
  }
  
  try {
    console.log('Using window.location.href for navigation');
    // Use the full URL with origin to ensure proper navigation
    const origin = window.location.origin;
    const fullUrl = `${origin}/dashboard?scan=${encodeURIComponent(scanId)}`;
    console.log('Navigating to:', fullUrl);
    
    // Force a hard navigation to ensure the page reloads with the new URL
    window.location.href = fullUrl;
    
    // Add a small delay to ensure the navigation happens
    setTimeout(() => {
      console.log('Navigation should have happened by now');
      // If we're still here, try again with a different method
      if (window.location.href !== fullUrl) {
        console.log('Navigation failed, trying again with window.location.replace');
        window.location.replace(fullUrl);
      }
    }, 100);
  } catch (error) {
    console.error('Navigation error:', error);
  }
};
```

### Changes to dashboard/page.tsx
```typescript
// Before
export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scanId = searchParams.get('scan');
  console.log('Dashboard page loaded with scanId:', scanId);
  const { isPremium } = useSubscription();
  
  // ...
}

// After
export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the scan ID from the URL parameters
  const scanIdFromParams = searchParams.get('scan');
  
  // Store the scan ID in state to ensure it persists during component lifecycle
  const [scanId, setScanId] = useState<string | null>(null);
  
  // Set the scan ID from URL parameters when the component mounts or URL changes
  useEffect(() => {
    if (scanIdFromParams) {
      console.log('Dashboard page loaded with scanId from URL:', scanIdFromParams);
      setScanId(scanIdFromParams);
    } else {
      console.log('No scan ID found in URL parameters');
    }
  }, [scanIdFromParams]);
  
  const { isPremium } = useSubscription();
  
  // ...
}
```

Also added timestamps to API requests to prevent caching:

```typescript
// Before
const response = await fetch(`/api/scan/status?id=${encodeURIComponent(scanId)}`, {
  headers
});

// After
const timestamp = new Date().getTime();
const response = await fetch(`/api/scan/status?id=${encodeURIComponent(scanId)}&_=${timestamp}`, {
  headers,
  cache: 'no-store'
});
```

## Verification
To verify the fix:
1. Run the application
2. Go to the dashboard
3. Click the "View Results" button for a completed scan
4. Verify that the scan results are displayed correctly
5. Check the browser console to ensure the scan ID is being properly passed and detected

## Related Issues
This fix builds on previous fixes for the dashboard "View Results" button:
- The original fix that changed from using `router.push()` to `window.location.href` for navigation
- The scan ID format fix that prevented using scan IDs with a "default-" prefix