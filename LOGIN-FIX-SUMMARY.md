# Login Rate Limit and Refresh Token Fix

## Problem

The application was experiencing two authentication-related issues:

1. **Rate Limit Exceeded (429)**: 
   ```
   Request rate limit reached: kittwppxvfbvwyyklwrn.supabase.co/auth/v1/token?grant_type=password:1
   ```

2. **Invalid Refresh Token (400)**:
   ```
   [AuthApiError: Invalid Refresh Token: Refresh Token Not Found]
   ```

## Solution Implemented

The solution addresses both issues with a comprehensive approach:

### 1. Rate Limiting Protection

- Added client-side rate limiting with exponential backoff
- Implemented tracking of login attempts with increasing wait times
- Added user-friendly error messages with wait time information

### 2. Refresh Token Error Handling

- Added specific handling for refresh token errors
- Implemented automatic session cleanup when refresh tokens are invalid
- Improved error messaging for session expiration

## Files Modified

- `src/components/auth/LoginForm.tsx` - Added rate limiting and error handling logic

## New Files Created

- `restart-login-fix.sh` - Script to restart the application with the fix
- `test-login-fix.js` - Test script to verify the fix is working
- `docs/login-rate-limit-fix.md` - Detailed documentation of the fix

## How to Apply the Fix

1. The fix has been applied to the codebase
2. Run the restart script to apply the changes:

   ```bash
   ./restart-login-fix.sh
   ```

## How to Test the Fix

1. Run the test script to verify the fix:

   ```bash
   node test-login-fix.js
   ```

2. Manual testing:
   - Try logging in multiple times in quick succession with incorrect credentials
   - Verify that rate limiting messages appear
   - Try logging in after a session expiration
   - Verify that refresh token errors are handled gracefully

## Technical Details

### Rate Limiting Implementation

```javascript
// Track login attempts to implement backoff
const [loginAttempts, setLoginAttempts] = useState(0);
const [lastAttemptTime, setLastAttemptTime] = useState(0);

// Calculate backoff time based on number of attempts (exponential backoff)
const getBackoffTime = (attempts: number): number => {
  // Start with 1 second, then increase exponentially (1s, 2s, 4s, etc.)
  return Math.min(Math.pow(2, attempts - 1) * 1000, 30000); // Max 30 seconds
};
```

### Error Handling

```javascript
// Handle rate limit errors specifically
if (error instanceof AuthError && 
    (error.message.includes('rate limit') || error.status === 429)) {
  setError('Login rate limit reached. Please wait a moment before trying again.');
  // Increase backoff for rate limit errors
  setLoginAttempts(prev => prev + 2);
} 
// Handle refresh token errors
else if (error instanceof AuthError && 
         error.message.includes('Refresh Token')) {
  // Clear any existing session that might be invalid
  await supabase.auth.signOut();
  setError('Your session has expired. Please sign in again.');
  setLoginAttempts(0); // Reset attempts for a fresh login
}
