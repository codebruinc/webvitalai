# Production Deployment Guide

This guide provides step-by-step instructions for deploying WebVital AI to production. It covers the CI/CD setup, environment configuration, performance optimization, monitoring, and deployment scripts.

## Table of Contents

- [Prerequisites](#prerequisites)
- [CI/CD Setup](#cicd-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying WebVital AI to production, ensure you have:

1. A GitHub repository with the WebVital AI codebase
2. Access to the following services:
   - Vercel account (for frontend deployment)
   - Supabase project
   - Stripe account
   - OpenAI API key
   - Redis instance (for background processing)
3. Domain name and DNS access

## CI/CD Setup

WebVital AI uses GitHub Actions for continuous integration and deployment. The workflow is defined in `.github/workflows/ci-cd.yml`.

### GitHub Actions Configuration

1. In your GitHub repository, go to Settings > Secrets and Variables > Actions
2. Add the following secrets:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Workflow Steps

The CI/CD workflow includes the following steps:

1. **Test**: Runs linting and unit tests
2. **Build**: Builds the Next.js application
3. **Deploy**: Deploys the application to Vercel

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file based on the `.env.production.template` file. This file should include all the environment variables needed for production.

Required environment variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Next.js
NEXT_PUBLIC_BASE_URL=https://webvitalai.com

# API Keys
OPENAI_API_KEY=your-openai-api-key
SECURITY_HEADERS_API_KEY=your-security-headers-api-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
NEXT_PUBLIC_STRIPE_PRICE_ID=your-stripe-price-id

# Redis (for Bull queue)
REDIS_URL=your-redis-url

# Monitoring and Logging
SENTRY_DSN=your-sentry-dsn
```

### Vercel Environment Configuration

1. In the Vercel dashboard, go to your project settings
2. Navigate to the Environment Variables section
3. Add all the environment variables from your `.env.production` file
4. Ensure that variables prefixed with `NEXT_PUBLIC_` are exposed to the browser

## Deployment Options

### Vercel Deployment (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure the project settings:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
3. Add environment variables
4. Deploy the application

### Docker Deployment

1. Build the Docker image:
   ```bash
   npm run docker:build
   ```

2. Build the worker Docker image:
   ```bash
   npm run docker:worker
   ```

3. Run with Docker Compose:
   ```bash
   npm run docker:compose
   ```

### Manual Deployment

Use the deployment script:

```bash
npm run deploy
```

## Performance Optimization

WebVital AI includes several performance optimizations:

### Next.js Optimizations

- **Image Optimization**: Configured in `next.config.js`
- **Response Compression**: Enabled in `next.config.js`
- **Bundle Size Optimization**: Configured in webpack settings

### Caching Strategies

- **Static Generation**: Used for static pages
- **Incremental Static Regeneration**: Used for semi-dynamic pages
- **Redis Caching**: Used for API responses and background job results

### CDN Configuration

1. Vercel automatically provides CDN capabilities
2. For custom CDN setup, configure your CDN to cache the following paths:
   - `/_next/static/*`: Cache for 1 year
   - `/static/*`: Cache for 1 year
   - `/api/*`: Do not cache (or use stale-while-revalidate)

## Monitoring and Logging

### Sentry Integration

WebVital AI uses Sentry for error tracking and performance monitoring. The configuration is in:
- `sentry.client.config.js`
- `sentry.server.config.js`
- `src/lib/sentry.ts`

To set up Sentry:

1. Create a Sentry project
2. Add your Sentry DSN to the environment variables
3. Deploy the application

### Health Checks

The application provides a health check endpoint at `/api/health` that returns the status of:
- API
- Database
- Redis

### Logging

Logs are sent to:
- Standard output (captured by Vercel)
- Sentry for error tracking

## Background Worker

The background worker processes jobs from the Redis queue. To deploy the worker:

1. Build the worker Docker image:
   ```bash
   npm run docker:worker
   ```

2. Deploy to a server with Docker:
   ```bash
   docker run -d --name webvitalai-worker \
     -e REDIS_URL=your-redis-url \
     -e NEXT_PUBLIC_SUPABASE_URL=your-supabase-url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key \
     -e SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key \
     -e OPENAI_API_KEY=your-openai-api-key \
     webvitalai-worker:latest
   ```

## Troubleshooting

### Common Issues

#### Deployment Failures

- Check the Vercel deployment logs
- Ensure all environment variables are set correctly
- Verify that the build process completes successfully

#### Background Worker Issues

- Check the worker logs
- Ensure Redis is accessible from the worker
- Verify that the worker has the correct environment variables

#### Database Connection Issues

- Check the Supabase connection string
- Ensure the Supabase service is running
- Verify that the database schema is up to date

### Getting Help

If you encounter issues that you can't resolve, you can:

- Check the [GitHub repository](https://github.com/your-organization/webvitalai) for known issues
- Open a new issue on GitHub
- Contact support at support@webvitalai.com