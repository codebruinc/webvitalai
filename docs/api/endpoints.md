# API Endpoints

This document provides detailed information about the API endpoints available in the WebVital AI application. Each endpoint is described with its URL, method, request parameters, response format, and example usage.

## Table of Contents

- [Authentication](#authentication)
- [Scan Endpoints](#scan-endpoints)
  - [Create Scan](#create-scan)
  - [Get Scan Status](#get-scan-status)
  - [Get Scan Results](#get-scan-results)
- [Subscription Endpoints](#subscription-endpoints)
  - [Create Checkout Session](#create-checkout-session)
  - [Create Customer Portal](#create-customer-portal)
  - [Get Subscription Status](#get-subscription-status)
- [Webhook Endpoints](#webhook-endpoints)
  - [Stripe Webhook](#stripe-webhook)

## Authentication

All API endpoints (except webhooks) require authentication. Authentication is handled by Supabase Auth, which provides JWT tokens for authenticated requests.

To authenticate API requests, include the JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

The token can be obtained by logging in through the Supabase Auth API or using the client-side authentication flow.

## Scan Endpoints

### Create Scan

Creates a new website scan and adds it to the processing queue.

**URL:** `/api/scan`

**Method:** `POST`

**Request Body:**
```json
{
  "url": "https://example.com",
  "options": {
    "device": "desktop",
    "categories": ["performance", "accessibility", "seo", "security"]
  }
}
```

**Request Parameters:**
- `url` (required): The URL of the website to scan
- `options` (optional): Scan options
  - `device` (optional): Device to emulate (desktop or mobile, default: desktop)
  - `categories` (optional): Categories to scan (default: all categories)

**Response:**
```json
{
  "scanId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "url": "https://example.com",
  "createdAt": "2025-05-05T00:33:48.000Z"
}
```

**Status Codes:**
- `201 Created`: Scan created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `429 Too Many Requests`: Rate limit exceeded

**Example:**
```javascript
// Client-side example
const createScan = async (url) => {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabase.auth.session().access_token}`
    },
    body: JSON.stringify({ url })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create scan');
  }
  
  return await response.json();
};
```

### Get Scan Status

Gets the status of a scan.

**URL:** `/api/scan/status`

**Method:** `GET`

**Query Parameters:**
- `scanId` (required): The ID of the scan

**Response:**
```json
{
  "scanId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress": 75,
  "currentTask": "Running accessibility tests",
  "updatedAt": "2025-05-05T00:34:48.000Z"
}
```

**Status Codes:**
- `200 OK`: Status retrieved successfully
- `400 Bad Request`: Invalid scan ID
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Scan not found

**Example:**
```javascript
// Client-side example
const getScanStatus = async (scanId) => {
  const response = await fetch(`/api/scan/status?scanId=${scanId}`, {
    headers: {
      'Authorization': `Bearer ${supabase.auth.session().access_token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get scan status');
  }
  
  return await response.json();
};
```

### Get Scan Results

Gets the results of a completed scan.

**URL:** `/api/scan/results`

**Method:** `GET`

**Query Parameters:**
- `scanId` (required): The ID of the scan

**Response:**
```json
{
  "scanId": "123e4567-e89b-12d3-a456-426614174000",
  "url": "https://example.com",
  "status": "completed",
  "completedAt": "2025-05-05T00:35:48.000Z",
  "scores": {
    "performance": 85,
    "accessibility": 92,
    "seo": 88,
    "security": 76
  },
  "metrics": [
    {
      "category": "performance",
      "name": "LCP",
      "value": 2.3,
      "unit": "s"
    },
    // More metrics...
  ],
  "issues": [
    {
      "id": "123",
      "category": "accessibility",
      "severity": "serious",
      "message": "Images must have alternate text",
      "code": "image-alt",
      "element": "<img src=\"example.jpg\">"
    },
    // More issues...
  ],
  "recommendations": [
    {
      "issueId": "123",
      "recommendation": "Add alt text to all images to improve accessibility",
      "impact": "high",
      "effort": "low"
    },
    // More recommendations...
  ]
}
```

**Status Codes:**
- `200 OK`: Results retrieved successfully
- `400 Bad Request`: Invalid scan ID
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Scan not found or results not available

**Example:**
```javascript
// Client-side example
const getScanResults = async (scanId) => {
  const response = await fetch(`/api/scan/results?scanId=${scanId}`, {
    headers: {
      'Authorization': `Bearer ${supabase.auth.session().access_token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get scan results');
  }
  
  return await response.json();
};
```

## Subscription Endpoints

### Create Checkout Session

Creates a Stripe Checkout session for subscription purchase.

**URL:** `/api/subscriptions/checkout`

**Method:** `POST`

**Request Body:**
```json
{
  "priceId": "price_1234567890",
  "successUrl": "https://webvitalai.com/dashboard?checkout=success",
  "cancelUrl": "https://webvitalai.com/pricing?checkout=canceled"
}
```

**Request Parameters:**
- `priceId` (optional): The Stripe Price ID (default: premium subscription price)
- `successUrl` (required): URL to redirect to after successful payment
- `cancelUrl` (required): URL to redirect to if the user cancels

**Response:**
```json
{
  "sessionId": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890"
}
```

**Status Codes:**
- `200 OK`: Checkout session created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Failed to create checkout session

**Example:**
```javascript
// Client-side example
const createCheckoutSession = async (successUrl, cancelUrl) => {
  const response = await fetch('/api/subscriptions/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabase.auth.session().access_token}`
    },
    body: JSON.stringify({ successUrl, cancelUrl })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }
  
  const { url } = await response.json();
  window.location.href = url;
};
```

### Create Customer Portal

Creates a Stripe Customer Portal session for subscription management.

**URL:** `/api/subscriptions/portal`

**Method:** `POST`

**Request Body:**
```json
{
  "returnUrl": "https://webvitalai.com/settings"
}
```

**Request Parameters:**
- `returnUrl` (required): URL to redirect to after the customer portal session

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/session/cs_test_1234567890"
}
```

**Status Codes:**
- `200 OK`: Customer portal session created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Customer not found
- `500 Internal Server Error`: Failed to create customer portal session

**Example:**
```javascript
// Client-side example
const createCustomerPortal = async (returnUrl) => {
  const response = await fetch('/api/subscriptions/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabase.auth.session().access_token}`
    },
    body: JSON.stringify({ returnUrl })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create customer portal');
  }
  
  const { url } = await response.json();
  window.location.href = url;
};
```

### Get Subscription Status

Gets the current subscription status for the authenticated user.

**URL:** `/api/subscriptions/status`

**Method:** `GET`

**Response:**
```json
{
  "status": "active",
  "plan": "premium",
  "currentPeriodEnd": "2025-06-05T00:33:48.000Z",
  "cancelAtPeriodEnd": false,
  "isPremium": true
}
```

**Status Codes:**
- `200 OK`: Status retrieved successfully
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Subscription not found

**Example:**
```javascript
// Client-side example
const getSubscriptionStatus = async () => {
  const response = await fetch('/api/subscriptions/status', {
    headers: {
      'Authorization': `Bearer ${supabase.auth.session().access_token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get subscription status');
  }
  
  return await response.json();
};
```

## Webhook Endpoints

### Stripe Webhook

Handles Stripe webhook events for subscription management.

**URL:** `/api/webhooks/stripe`

**Method:** `POST`

**Headers:**
- `Stripe-Signature` (required): Signature to verify the webhook event

**Request Body:**
Raw Stripe event object

**Response:**
```json
{
  "received": true
}
```

**Status Codes:**
- `200 OK`: Webhook processed successfully
- `400 Bad Request`: Invalid webhook payload
- `401 Unauthorized`: Invalid signature
- `500 Internal Server Error`: Failed to process webhook

**Note:** This endpoint is called by Stripe and should not be called directly from client-side code.

## Rate Limiting

API endpoints are rate-limited to prevent abuse. The rate limits are as follows:

- Scan creation: 5 requests per hour for free users, 60 requests per hour for premium users
- Other endpoints: 100 requests per hour per user

When a rate limit is exceeded, the API returns a `429 Too Many Requests` status code with a `Retry-After` header indicating the number of seconds to wait before retrying.

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Error message",
    "code": "error_code"
  }
}
```

Common error codes:

- `invalid_request`: Invalid request parameters
- `authentication_required`: Authentication required
- `not_found`: Resource not found
- `rate_limit_exceeded`: Rate limit exceeded
- `subscription_required`: Premium subscription required
- `internal_error`: Internal server error

## Cross-Origin Resource Sharing (CORS)

The API supports CORS for cross-origin requests from the following origins:

- `https://webvitalai.com`
- `https://www.webvitalai.com`
- `http://localhost:3000` (for local development)

For other origins, CORS requests will be rejected.

## API Versioning

The API is currently at version 1 (implicit in the URL structure). Future versions will be explicitly versioned in the URL path (e.g., `/api/v2/scan`).

When breaking changes are introduced, a new API version will be created, and the old version will be maintained for a deprecation period.