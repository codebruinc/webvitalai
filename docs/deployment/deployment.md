# Deployment Guide

This guide provides step-by-step instructions for deploying WebVital AI to various environments. It covers deployment to Vercel, AWS, and Docker-based environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment to Vercel](#deployment-to-vercel)
- [Deployment to AWS](#deployment-to-aws)
- [Docker Deployment](#docker-deployment)
- [CI/CD Setup](#cicd-setup)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying WebVital AI, ensure you have:

1. Completed the [environment setup](./environment.md)
2. Set up all required external services (Supabase, Stripe, OpenAI, Redis)
3. Prepared your environment variables
4. Built and tested the application locally

## Deployment to Vercel

Vercel is the recommended deployment platform for WebVital AI, as it provides seamless integration with Next.js.

### Step 1: Prepare Your Repository

Ensure your code is in a Git repository (GitHub, GitLab, or Bitbucket).

### Step 2: Connect to Vercel

1. Create an account on [Vercel](https://vercel.com) if you don't have one
2. Click "New Project" in the Vercel dashboard
3. Import your Git repository
4. Select the repository containing WebVital AI

### Step 3: Configure Project

1. Configure the project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or the directory containing your Next.js project)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

2. Add environment variables:
   - Click "Environment Variables"
   - Add all required environment variables from the [Environment Setup](./environment.md) document
   - Ensure sensitive variables are marked as secrets

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build and deployment to complete
3. Once deployed, Vercel will provide a URL for your application

### Step 5: Configure Custom Domain (Optional)

1. In the Vercel dashboard, go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow the instructions to configure DNS settings

### Step 6: Set Up Background Worker

For the background worker, you have two options:

#### Option 1: Vercel Cron Jobs (Limited)

For simple scheduled tasks, you can use Vercel Cron Jobs:

1. Create a file at `src/app/api/cron/route.ts`
2. Implement the cron job handler
3. Configure the cron schedule in `vercel.json`

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### Option 2: Separate Worker Service (Recommended)

For full background processing capabilities:

1. Set up a separate server for the worker
2. Deploy the worker code to this server
3. Configure the worker to connect to the same Redis instance
4. Set up process management (PM2, systemd, etc.)

## Deployment to AWS

### Step 1: Set Up AWS Resources

1. Create an AWS account if you don't have one
2. Set up the following resources:
   - EC2 instance or ECS cluster for the web application
   - EC2 instance or ECS cluster for the background worker
   - ElastiCache for Redis
   - Application Load Balancer (ALB)
   - Route 53 for DNS (optional)
   - ACM for SSL certificates

### Step 2: Prepare the Application

1. Build the application:
   ```bash
   npm run build
   ```

2. Create a deployment package:
   ```bash
   tar -czf webvitalai.tar.gz .next node_modules package.json package-lock.json public
   ```

### Step 3: Deploy to EC2

1. Launch an EC2 instance with Amazon Linux 2 or Ubuntu
2. Install Node.js and other dependencies:
   ```bash
   # For Amazon Linux 2
   curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs

   # For Ubuntu
   curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Upload the deployment package:
   ```bash
   scp -i your-key.pem webvitalai.tar.gz ec2-user@your-instance-ip:~
   ```

4. Extract and set up the application:
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   mkdir webvitalai
   tar -xzf webvitalai.tar.gz -C webvitalai
   cd webvitalai
   ```

5. Set up environment variables:
   ```bash
   cat > .env.production << EOL
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   # Add all other environment variables
   EOL
   ```

6. Set up process management with PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "webvitalai" -- start
   pm2 startup
   pm2 save
   ```

### Step 4: Set Up the Background Worker

1. Launch another EC2 instance or use the same instance
2. Set up the worker:
   ```bash
   cd webvitalai
   pm2 start npm --name "webvitalai-worker" -- run worker
   pm2 save
   ```

### Step 5: Set Up Load Balancer and SSL

1. Create an Application Load Balancer (ALB) in the AWS console
2. Configure listeners for HTTP (port 80) and HTTPS (port 443)
3. Create a target group for your EC2 instances
4. Request an SSL certificate through AWS Certificate Manager (ACM)
5. Configure the HTTPS listener to use the SSL certificate
6. Set up a redirect from HTTP to HTTPS

### Step 6: Configure DNS

1. Create a hosted zone in Route 53 (if using AWS for DNS)
2. Create an A record pointing to your ALB
3. Wait for DNS propagation

## Docker Deployment

### Step 1: Create Dockerfile

Create a `Dockerfile` in the root of your project:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Step 2: Create Docker Compose File

Create a `docker-compose.yml` file for local development and testing:

```yaml
version: '3'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      # Add all other environment variables
    depends_on:
      - redis

  worker:
    build: .
    command: npm run worker
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      # Add all other environment variables
    depends_on:
      - redis

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### Step 3: Build and Run Docker Containers

```bash
# Build the Docker images
docker-compose build

# Start the containers
docker-compose up -d
```

### Step 4: Deploy to Production

For production deployment with Docker, you can use:

- AWS ECS (Elastic Container Service)
- Google Cloud Run
- Azure Container Instances
- Kubernetes
- Docker Swarm

Example deployment to AWS ECS:

1. Create an ECR repository
2. Push your Docker image to ECR
3. Create an ECS cluster
4. Define task definitions for the web app and worker
5. Create ECS services for the web app and worker
6. Set up an Application Load Balancer
7. Configure auto-scaling

## CI/CD Setup

### GitHub Actions

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### GitLab CI/CD

Create a `.gitlab-ci.yml` file:

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/
      - node_modules/
      - package.json
      - package-lock.json
      - public/

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache curl
    - curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_your_project_id/your_deploy_hook"
  only:
    - main
```

## Post-Deployment Verification

After deploying WebVital AI, perform these verification steps:

1. **Smoke Test**:
   - Visit the application URL
   - Sign up for a new account
   - Submit a URL for scanning
   - Verify scan results are displayed

2. **Feature Verification**:
   - Test authentication (signup, login, logout)
   - Test subscription management (upgrade to premium, manage subscription)
   - Test website scanning (submit URL, view results)
   - Test premium features (detailed recommendations, industry benchmarks, etc.)

3. **Performance Check**:
   - Run Lighthouse on your deployed application
   - Check page load times
   - Verify API response times

4. **Security Verification**:
   - Verify HTTPS is working correctly
   - Check security headers
   - Test authentication and authorization

## Troubleshooting

### Common Deployment Issues

#### Application Not Starting

**Symptoms**: The application fails to start, or you see a 502 Bad Gateway error.

**Possible Causes**:
- Missing environment variables
- Database connection issues
- Port conflicts

**Solutions**:
- Check application logs for error messages
- Verify all environment variables are set correctly
- Ensure the database is accessible from the application server
- Check if the port is already in use by another process

#### Background Worker Not Processing Jobs

**Symptoms**: Jobs are being added to the queue but not processed.

**Possible Causes**:
- Worker process not running
- Redis connection issues
- Incorrect Redis URL

**Solutions**:
- Check worker logs for error messages
- Verify the worker process is running
- Ensure Redis is accessible from the worker server
- Check the Redis URL in the environment variables

#### API Errors

**Symptoms**: API endpoints return errors or timeouts.

**Possible Causes**:
- External API rate limits
- Incorrect API keys
- Network issues

**Solutions**:
- Check application logs for error messages
- Verify API keys are correct
- Implement retry logic for external API calls
- Check network connectivity to external APIs

### Debugging Tools

- **Application Logs**: Check the logs for error messages
- **Redis CLI**: Use the Redis CLI to inspect queues and job status
- **Network Tools**: Use tools like `curl` and `ping` to check connectivity
- **Monitoring Tools**: Set up monitoring to track application health

### Getting Help

If you encounter issues that you can't resolve, you can:

- Check the [GitHub repository](https://github.com/your-organization/webvitalai) for known issues
- Open a new issue on GitHub
- Contact support at support@webvitalai.com