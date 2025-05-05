# API Authentication

This document explains how authentication works in the WebVital AI API and how to authenticate your requests.

## Authentication Flow

WebVital AI uses Supabase Auth for authentication, which provides a JWT-based authentication system. The authentication flow is as follows:

1. User signs up or logs in through the WebVital AI interface
2. Supabase Auth issues a JWT token
3. The token is stored in the browser's local storage
4. The token is included in API requests as a bearer token
5. The server validates the token and identifies the user

## JWT Tokens

JWT (JSON Web Token) is an open standard for securely transmitting information between parties as a JSON object. In WebVital AI, JWTs are used to authenticate API requests.

A JWT token consists of three parts:
1. Header: Contains the token type and signing algorithm
2. Payload: Contains claims about the user and token
3. Signature: Used to verify the token hasn't been tampered with

## Authenticating API Requests

To authenticate API requests, include the JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Example using fetch:

```javascript
const fetchData = async (url) => {
  const token = supabase.auth.session()?.access_token;
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

Example using axios:

```javascript
const fetchData = async (url) => {
  const token = supabase.auth.session()?.access_token;
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};
```

## Token Expiration and Refresh

JWT tokens have an expiration time, typically 1 hour for access tokens. When a token expires, you need to refresh it to get a new valid token.

Supabase Auth handles token refresh automatically in the client-side library. However, if you're making API requests directly, you may need to handle token refresh manually.

Example of token refresh:

```javascript
const refreshToken = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    throw error;
  }
  
  return data.session.access_token;
};
```

## Server-Side Authentication

For server-side authentication (e.g., in Next.js API routes), you can extract and verify the token from the request headers:

```javascript
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  // Create authenticated Supabase client
  const supabase = createServerSupabaseClient({ req, res });
  
  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    return res.status(401).json({
      error: {
        message: 'Not authenticated',
        code: 'authentication_required'
      }
    });
  }
  
  // User is authenticated, proceed with the request
  const { user } = session;
  
  // ... handle the request
}
```

## Role-Based Access Control

WebVital AI implements role-based access control (RBAC) to restrict access to certain API endpoints based on the user's subscription status.

The user's subscription status is stored in the database and checked when accessing premium features. For example, detailed scan results are only available to premium users.

Example of role-based access control:

```javascript
export default async function handler(req, res) {
  // ... authentication code
  
  // Check if user has premium subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plan')
    .eq('user_id', user.id)
    .single();
  
  const isPremium = subscription?.status === 'active' && subscription?.plan === 'premium';
  
  if (!isPremium && req.query.detailed === 'true') {
    return res.status(403).json({
      error: {
        message: 'Premium subscription required',
        code: 'subscription_required'
      }
    });
  }
  
  // ... handle the request
}
```

## Security Considerations

### Token Storage

JWT tokens should be stored securely to prevent token theft. In browser environments, tokens are typically stored in:

- Memory (variables): Safest but lost on page refresh
- Local Storage: Persistent but vulnerable to XSS attacks
- HTTP-only Cookies: Protected from JavaScript but vulnerable to CSRF attacks

WebVital AI uses Supabase Auth's default storage mechanism, which stores tokens in local storage. To mitigate XSS risks, the application implements:

- Content Security Policy (CSP) to prevent unauthorized script execution
- Input validation and sanitization to prevent XSS vulnerabilities
- Regular security audits and dependency updates

### HTTPS

All API requests must be made over HTTPS to ensure the token is transmitted securely. Requests made over HTTP will be rejected.

### Token Scope

JWT tokens issued by Supabase Auth have a limited scope and contain only the necessary claims to identify the user. Sensitive information is not included in the token payload.

## Troubleshooting

### Common Authentication Errors

#### 401 Unauthorized

This error occurs when:
- No token is provided
- The token is invalid or expired
- The token signature is invalid

Solution: Ensure you're including a valid token in the `Authorization` header. If the token is expired, refresh it.

#### 403 Forbidden

This error occurs when:
- The user doesn't have permission to access the resource
- The user's subscription doesn't include the requested feature

Solution: Check the user's subscription status and ensure they have the necessary permissions.

### Debugging Authentication Issues

To debug authentication issues:

1. Check the token expiration time:
```javascript
const token = supabase.auth.session()?.access_token;
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires at:', new Date(payload.exp * 1000));
```

2. Verify the token is being sent correctly:
```javascript
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
console.log('Response status:', response.status);
```

3. Check for CORS issues:
```javascript
try {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  console.log('Response:', data);
} catch (error) {
  console.error('Error:', error);
}
```

## API Keys (Future Feature)

In a future update, WebVital AI plans to support API key authentication for programmatic access to the API. This will allow users to create and manage API keys for integrating WebVital AI with other systems.

API keys will provide a more convenient authentication method for server-to-server communication, while maintaining the security of the user's account.

Stay tuned for updates on this feature.