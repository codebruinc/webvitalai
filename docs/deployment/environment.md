# Environment Setup

This document provides detailed information about setting up the environment for deploying WebVital AI. It covers environment variables, external service configuration, and infrastructure requirements.

## Environment Variables

WebVital AI uses environment variables for configuration. These variables should be set in the deployment environment or in a `.env.local` file for local development.

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abcdefghijklm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-abcdefghijklmnopqrstuvwxyz123456` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_abcdefghijklmnopqrstuvwxyz` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_abcdefghijklmnopqrstuvwxyz` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_abcdefghijklmnopqrstuvwxyz` |
| `REDIS_URL` | Redis connection URL | `redis://username:password@host:port` |
| `SECURITY_HEADERS_API_KEY` | SecurityHeaders.com API key | `abcdefghijklmnopqrstuvwxyz` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | `https://webvitalai.com` |

### Optional Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Node.js environment | `development` | `production` |
| `PORT` | Port for the Next.js server | `3000` | `8080` |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe price ID for premium subscription | - | `price_1234567890` |
| `MAX_SCAN_CONCURRENCY` | Maximum number of concurrent scans | `5` | `10` |
| `SCAN_TIMEOUT_SECONDS` | Timeout for scan jobs in seconds | `300` | `600` |
| `LOG_LEVEL` | Logging level | `info` | `debug` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | - | `https://example.com,https://app.example.com` |

## External Services Configuration

### Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Set up the database schema using the migration files in the `supabase/migrations` directory
3. Configure authentication providers (email/password is required)
4. Set up row-level security policies for the database tables
5. Get the project URL and API keys from the project settings

### Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Set up a product for the premium subscription with a recurring price of $15/month
3. Configure the webhook endpoint to point to `https://your-domain.com/api/webhooks/stripe`
4. Subscribe to the following webhook events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
5. Get the publishable key, secret key, and webhook signing secret from the Stripe dashboard

### OpenAI

1. Create an OpenAI account at [platform.openai.com](https://platform.openai.com)
2. Get an API key from the API keys section
3. Ensure your account has sufficient quota for the expected usage

### Redis

Redis is used for background job processing with Bull. You can use:

- Self-hosted Redis server
- Managed Redis service (Redis Labs, AWS ElastiCache, DigitalOcean Managed Redis, etc.)
- Redis-compatible alternatives (Upstash, KeyDB, etc.)

Ensure your Redis instance:
- Is accessible from your application servers
- Has persistence enabled (AOF or RDB)
- Has sufficient memory for your expected workload
- Is secured with authentication

### SecurityHeaders.com

1. Sign up for an API key at [securityheaders.com](https://securityheaders.com)
2. Configure the API key in your environment variables

## Infrastructure Requirements

### Minimum Requirements

For a basic deployment serving a small number of users:

- **Web Server**:
  - 1 CPU core
  - 2 GB RAM
  - 20 GB SSD storage
  - Node.js 18 or later

- **Redis**:
  - 1 CPU core
  - 1 GB RAM
  - 10 GB SSD storage
  - Redis 6 or later

- **Database**:
  - Managed by Supabase

### Recommended Requirements

For a production deployment serving a moderate number of users:

- **Web Server**:
  - 2+ CPU cores
  - 4+ GB RAM
  - 40+ GB SSD storage
  - Node.js 18 or later
  - Load balancer for multiple instances

- **Redis**:
  - 2+ CPU cores
  - 2+ GB RAM
  - 20+ GB SSD storage
  - Redis 6 or later
  - Replication for high availability

- **Background Worker**:
  - 2+ CPU cores
  - 4+ GB RAM
  - 20+ GB SSD storage
  - Node.js 18 or later
  - Multiple instances for parallel processing

- **Database**:
  - Managed by Supabase
  - Consider a higher tier plan for better performance

### Scaling Considerations

As your user base grows, consider:

- **Horizontal Scaling**:
  - Add more web server instances behind a load balancer
  - Add more background worker instances
  - Implement Redis clustering for distributed job processing

- **Vertical Scaling**:
  - Increase CPU and RAM for web servers and workers
  - Upgrade Redis and database plans for better performance

- **Caching**:
  - Implement CDN for static assets
  - Add Redis caching for frequently accessed data
  - Consider edge caching for API responses

- **Database Optimization**:
  - Implement database indexing for frequently queried fields
  - Consider read replicas for read-heavy workloads
  - Implement database sharding for very large datasets

## Network Requirements

### Inbound Traffic

- HTTP/HTTPS (ports 80/443) for web traffic
- SSH (port 22) for server administration (restricted to authorized IPs)

### Outbound Traffic

The application needs to make outbound connections to:

- Supabase API (HTTPS)
- OpenAI API (HTTPS)
- Stripe API (HTTPS)
- SecurityHeaders.com API (HTTPS)
- Websites being scanned (HTTP/HTTPS)

### Firewall Rules

Configure your firewall to:

- Allow inbound traffic on ports 80/443 from all sources
- Allow inbound traffic on port 22 from authorized IPs only
- Allow all outbound traffic on ports 80/443
- Block all other inbound traffic

### SSL/TLS

- Use TLS 1.2 or later
- Configure strong cipher suites
- Implement HSTS
- Obtain and configure SSL certificates (Let's Encrypt or commercial)

## Monitoring and Logging

### Recommended Monitoring

- **Application Monitoring**:
  - New Relic, Datadog, or similar APM solution
  - Monitor response times, error rates, and throughput

- **Server Monitoring**:
  - CPU, memory, disk, and network usage
  - Process monitoring for Node.js and Redis

- **Database Monitoring**:
  - Query performance
  - Connection pool usage
  - Storage usage

- **Background Job Monitoring**:
  - Job completion rates
  - Job failure rates
  - Queue sizes

### Logging

- **Application Logs**:
  - Use structured logging (JSON format)
  - Include request IDs for tracing
  - Log all API requests and responses (excluding sensitive data)

- **Error Tracking**:
  - Implement error tracking with Sentry, Rollbar, or similar
  - Set up alerts for critical errors

- **Audit Logging**:
  - Log authentication events
  - Log subscription changes
  - Log administrative actions

## Backup and Disaster Recovery

### Database Backups

- Supabase provides automated backups
- Consider additional backups for critical data
- Test backup restoration periodically

### Application Backups

- Back up environment configuration
- Back up custom code and modifications
- Store backups in a secure, off-site location

### Disaster Recovery Plan

- Document recovery procedures
- Define Recovery Time Objective (RTO) and Recovery Point Objective (RPO)
- Test disaster recovery procedures periodically

## Security Considerations

### Application Security

- Keep dependencies up to date
- Implement Content Security Policy (CSP)
- Use HTTPS for all connections
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs

### Infrastructure Security

- Use private networks for internal communication
- Implement network segmentation
- Use VPC for cloud deployments
- Restrict SSH access to authorized IPs
- Use key-based authentication for SSH

### Data Security

- Encrypt sensitive data at rest
- Use HTTPS for data in transit
- Implement proper access controls
- Follow data protection regulations (GDPR, CCPA, etc.)
- Regularly audit data access

## Compliance

Depending on your target market, ensure compliance with:

- GDPR (European Union)
- CCPA (California)
- HIPAA (if handling health data)
- PCI DSS (if handling payment data directly)
- Local data protection regulations

## Next Steps

After setting up the environment, proceed to the [Deployment Guide](./deployment.md) for instructions on deploying the application.