# Redis SSL Connection Troubleshooting

This document provides guidance on troubleshooting and fixing SSL/TLS connection issues with Redis Cloud in the WebVitalAI application.

## Common SSL Error: ERR_SSL_PACKET_LENGTH_TOO_LONG

The error `ERR_SSL_PACKET_LENGTH_TOO_LONG` typically occurs when:

1. A client attempts to establish an SSL/TLS connection to a server that isn't expecting it
2. There's a mismatch in the SSL/TLS configuration
3. The client is connecting to a non-SSL port with SSL enabled

This error is common when working with Redis Cloud, as it requires specific TLS configuration.

## Root Causes

The main causes of Redis SSL connection issues in WebVitalAI are:

1. **TLS vs Non-TLS Mismatch**: The Redis instance is configured for non-TLS connections, but the code is trying to use TLS
2. **Incorrect TLS Configuration**: The TLS settings in the Redis connection options are incomplete or incorrect
3. **Hardcoded Credentials**: Using hardcoded Redis credentials instead of environment variables
4. **Port Mismatch**: Connecting to the wrong port (SSL vs non-SSL)

## Applied Fixes

The following fixes have been implemented to resolve the Redis SSL connection issues:

1. **Non-TLS Connection**: Updated `queueService.ts` to use non-TLS connections for Redis Cloud, as testing showed this works better
2. **Environment Variable Support**: Added full support for Redis connection details from environment variables
3. **Improved Error Handling**: Added detailed error logging for SSL-related errors
4. **Fallback Mechanisms**: Implemented fallback to mock queue when Redis is unavailable

## How to Fix Redis SSL Issues

### Option 1: Use the Fix Script

We've provided a script to automatically fix Redis SSL connection issues:

```bash
# ES Module version
node scripts/fix-redis-ssl.js

# OR CommonJS version (if you encounter module errors)
node scripts/fix-redis-ssl.cjs
```

This script will:
1. Update your `.env.local` file with the correct Redis configuration
2. Create a backup of your original configuration
3. Guide you through setting up the correct Redis connection parameters

### Option 2: Manual Configuration

If you prefer to manually configure Redis:

1. Update your `.env.local` file with the following settings:

```
# Redis (for Bull queue)
REDIS_URL=your-redis-host.redns.redis-cloud.com
REDIS_PORT=your-redis-port
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
REDIS_MAX_RETRIES=5
REDIS_RETRY_DELAY_MS=5000
```

2. Ensure your Redis Cloud instance is properly configured for TLS connections

### Option 3: Test Redis Connection

To test your Redis connection and diagnose issues:

```bash
# ES Module version
node scripts/test-redis-connection.js

# OR CommonJS version (if you encounter module errors)
node scripts/test-redis-connection.cjs
```

This script will test multiple connection configurations and help identify which one works best for your Redis instance.

### Verifying the Fix

After applying the fix, you can verify that it works correctly:

```bash
# ES Module version
node scripts/verify-redis-fix.js

# OR CommonJS version (if you encounter module errors)
node scripts/verify-redis-fix.cjs
```

This script will attempt to connect to Redis using the non-TLS configuration and execute a simple PING command to verify that the connection works.

## Testing the Fix

After applying the fix:

1. Run the verification script to confirm the Redis connection works
2. Restart your application
3. Try using the "analyze website" function again
4. Check the logs for any remaining Redis connection errors

If you still encounter issues, run the test script to diagnose the problem further.

## Technical Details

### Connection Configuration for Redis Cloud

Based on testing, we found that this specific Redis Cloud instance works best with **non-TLS connections**:

```javascript
{
  // Explicitly disable TLS for this Redis instance
  tls: false
}
```

If your Redis Cloud instance is configured for TLS, you would use this configuration instead:

```javascript
{
  tls: {
    rejectUnauthorized: false,
    servername: 'your-redis-host.redns.redis-cloud.com'
  }
}
```

The `servername` parameter is particularly important for TLS connections as it's used for SNI (Server Name Indication) during the TLS handshake.

### Connection Options

The updated code supports multiple ways to connect to Redis:

1. **URL-based connection**: Using a full Redis URL (`redis://` or `rediss://`)
2. **Parameter-based connection**: Using individual connection parameters
3. **Fallback to local Redis**: When no Redis Cloud configuration is provided

### Error Handling and Retry Logic

The updated code includes:

1. Detailed error logging for SSL-related errors
2. Automatic retry with configurable retry count and delay
3. Fallback to mock queue when Redis is unavailable

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "packet length too long" error | Try using non-TLS connection by setting `tls: false` |
| Connection timeout | Check Redis host, port, and network connectivity |
| Authentication failed | Verify username and password in environment variables |
| TLS handshake failed | Check if Redis instance is configured for TLS or non-TLS |
| Connection refused | Verify port number and firewall settings |

## Further Assistance

If you continue to experience issues with Redis connections:

1. Run the test script to diagnose the problem
2. Check Redis Cloud console for connection information
3. Verify network connectivity to Redis Cloud
4. Ensure your Redis instance supports TLS connections