# Architecture

WebVital AI follows a modular, service-oriented architecture that separates concerns and promotes maintainability. This document provides an overview of the system architecture, key components, and data flow.

## System Architecture

WebVital AI is built as a Next.js application with a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  (Next.js Pages, React Components, Browser JavaScript)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Application Layer                        │
│  (Next.js API Routes, Server Components, Middleware)        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Integration Layer                        │
│  (Service Modules, External API Clients)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                       Data Layer                            │
│  (Supabase, Redis)                                          │
└─────────────────────────────────────────────────────────────┘
```

### Client Layer

The client layer consists of Next.js pages, React components, and browser JavaScript. It handles:

- User interface rendering
- Client-side state management
- Form handling and validation
- Client-side routing
- User interactions

### Application Layer

The application layer consists of Next.js API routes, server components, and middleware. It handles:

- Request processing
- Authentication and authorization
- Business logic
- Data validation
- Error handling

### Integration Layer

The integration layer consists of service modules and external API clients. It handles:

- Communication with external APIs (Lighthouse, axe-core, OpenAI, SecurityHeaders.com, Stripe)
- Data transformation and normalization
- Error handling and retries
- Caching

### Data Layer

The data layer consists of Supabase (PostgreSQL) and Redis. It handles:

- Data storage and retrieval
- Background job processing
- Caching

## Key Components

### Next.js App Router

WebVital AI uses the Next.js App Router for routing and server components. This provides:

- File-based routing
- Server components for improved performance
- API routes for backend functionality
- Middleware for authentication and route protection

### Supabase

Supabase provides authentication and database services:

- User authentication and management
- PostgreSQL database with row-level security
- Real-time subscriptions
- Storage for scan results and user data

### Background Processing

WebVital AI uses Bull with Redis for background processing:

- Job queue for website scans
- Scheduled jobs for automated alerts
- Retry mechanism for failed jobs
- Job prioritization

### External API Integration

WebVital AI integrates with several external APIs:

- **Lighthouse**: For performance and SEO analysis (see [Lighthouse Integration](#lighthouse-integration))
- **axe-core**: For accessibility testing
- **SecurityHeaders.com**: For security headers checking
- **OpenAI**: For AI-powered recommendations
- **Stripe**: For subscription management

## Data Model

The database schema consists of the following key tables:

### Users

Extends the Supabase auth.users table with additional user information:

- `id`: UUID (primary key, from auth.users)
- `email`: String (from auth.users)
- `created_at`: Timestamp (from auth.users)
- `updated_at`: Timestamp
- `subscription_status`: String (free, premium)
- `subscription_id`: String (Stripe subscription ID)
- `customer_id`: String (Stripe customer ID)

### Websites

Stores information about websites being monitored:

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users.id)
- `url`: String
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `last_scan_id`: UUID (foreign key to scans.id)
- `is_active`: Boolean

### Scans

Stores information about website scans:

- `id`: UUID (primary key)
- `website_id`: UUID (foreign key to websites.id)
- `user_id`: UUID (foreign key to users.id)
- `status`: String (pending, processing, completed, failed)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `completed_at`: Timestamp
- `error`: String

### Metrics

Stores performance metrics from scans:

- `id`: UUID (primary key)
- `scan_id`: UUID (foreign key to scans.id)
- `category`: String (performance, accessibility, seo, security)
- `name`: String
- `value`: Float
- `created_at`: Timestamp

### Issues

Stores issues detected during scans:

- `id`: UUID (primary key)
- `scan_id`: UUID (foreign key to scans.id)
- `category`: String (performance, accessibility, seo, security)
- `severity`: String (critical, serious, moderate, minor)
- `message`: String
- `code`: String
- `element`: String
- `created_at`: Timestamp

### Recommendations

Stores AI-generated recommendations for fixing issues:

- `id`: UUID (primary key)
- `issue_id`: UUID (foreign key to issues.id)
- `recommendation`: String
- `impact`: String (high, medium, low)
- `effort`: String (high, medium, low)
- `created_at`: Timestamp

### Subscriptions

Stores information about user subscriptions:

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users.id)
- `stripe_subscription_id`: String
- `stripe_customer_id`: String
- `status`: String (active, canceled, past_due)
- `plan`: String (premium)
- `current_period_start`: Timestamp
- `current_period_end`: Timestamp
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Alerts

Stores alert configurations and history:

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users.id)
- `website_id`: UUID (foreign key to websites.id)
- `type`: String (performance_drop, new_issues, threshold)
- `threshold`: Float
- `metric`: String
- `is_active`: Boolean
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Industry Benchmarks

Stores industry benchmark data:

- `id`: UUID (primary key)
- `industry`: String
- `metric`: String
- `p10`: Float (10th percentile)
- `p50`: Float (50th percentile)
- `p90`: Float (90th percentile)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Data Flow

### Website Scanning Process

1. User submits a URL for scanning via the UrlForm component
2. The form submits a POST request to the `/api/scan` endpoint
3. The API route creates a new scan record in the database and adds a job to the queue
4. The background worker picks up the job and processes it:
   - Calls Lighthouse API for performance and SEO analysis
   - Calls axe-core for accessibility testing
   - Calls SecurityHeaders.com API for security headers checking
   - Normalizes and stores the results in the database
   - Calls OpenAI API to generate recommendations for issues
5. The API route updates the scan status to "completed"
6. The client polls the `/api/scan/status` endpoint to check the scan status
7. When the scan is complete, the client fetches the results from the `/api/scan/results` endpoint
8. The results are displayed in the dashboard

### Subscription Management Process

1. User clicks "Upgrade to Premium" on the pricing page
2. The client sends a POST request to the `/api/subscriptions/checkout` endpoint
3. The API route creates a Stripe Checkout Session and returns the session ID
4. The client redirects to the Stripe Checkout page
5. User completes the payment on the Stripe Checkout page
6. Stripe sends a webhook to the `/api/webhooks/stripe` endpoint
7. The webhook handler updates the user's subscription status in the database
8. User is redirected back to the application with access to premium features

## Security Considerations

### Authentication and Authorization

- Authentication is handled by Supabase Auth
- Middleware checks authentication status for protected routes
- Row-level security in Supabase ensures users can only access their own data
- API routes check authentication and authorization before processing requests

### Data Protection

- Sensitive data (API keys, credentials) is stored in environment variables
- Database access is restricted by row-level security policies
- HTTPS is enforced for all communication
- Content Security Policy is implemented to prevent XSS attacks

### API Security

- Rate limiting is implemented for API routes
- Input validation is performed on all user inputs
- API keys are never exposed to the client
- Webhook signatures are verified for Stripe webhooks

## Scalability Considerations

### Horizontal Scaling

- Next.js application can be deployed to multiple instances behind a load balancer
- Background workers can be scaled independently based on queue size
- Redis can be configured for high availability with Redis Sentinel or Redis Cluster

### Vertical Scaling

- Database can be scaled by upgrading the Supabase plan
- Redis can be scaled by increasing memory allocation
- Application instances can be scaled by increasing CPU and memory allocation

### Caching

- Results are cached to reduce API calls to external services
- Redis is used for caching frequently accessed data
- Next.js server components reduce client-side rendering and improve performance

## Lighthouse Integration

WebVital AI uses a specialized architecture for Lighthouse integration to overcome ESM compatibility challenges with Next.js:

```
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Application                        │
│  (CommonJS environment)                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Imports via CJS wrapper
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               lighthouse-wrapper.cjs                        │
│  (CommonJS wrapper that spawns a separate process)          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Spawns Node.js process
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               run-lighthouse.js                             │
│  (ESM script that runs Lighthouse)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Writes results to temp file
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Temporary JSON File                           │
│  (File-based communication channel)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Read by lighthouseService
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               lighthouseService.ts                          │
│  (Processes and normalizes results)                         │
└─────────────────────────────────────────────────────────────┘
```

### Why This Approach

This architecture was implemented to solve compatibility issues between:

1. **Lighthouse** - Which requires ESM modules and uses `import.meta.url` for path resolution
2. **Next.js** - Which uses CommonJS by default and doesn't support `import.meta.url`

### How It Works

1. **Process Separation**: Lighthouse runs in a separate Node.js process to isolate its ESM requirements
2. **Dual Module System Support**:
   - `lighthouse-wrapper.cjs` - CommonJS wrapper for Next.js compatibility
   - `lighthouse-wrapper.js` - ESM wrapper for use in other ESM contexts
   - `run-lighthouse.js` - Pure ESM script that actually runs Lighthouse

3. **File-Based Communication**: Results are passed between processes via temporary JSON files

4. **Error Handling**: Comprehensive error handling at each layer ensures robust operation

### Developer Considerations

- When working with the Lighthouse integration:
  - Avoid direct imports of Lighthouse in the Next.js application code
  - Use the provided wrapper functions in `lighthouseService.ts`
  - Ensure proper error handling for process spawning and file operations
  - Be aware of the temporary file usage for passing results between processes