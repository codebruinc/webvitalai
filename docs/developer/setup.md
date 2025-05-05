# Setup Instructions

This guide will help you set up the WebVital AI project for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **npm** (v8 or later)
- **Git**
- **Redis** (for background job processing)

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/webvitalai.git
cd webvitalai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Lighthouse Dependencies

The project uses Lighthouse for performance and SEO analysis, which requires additional dependencies:

```bash
# Install Lighthouse dependencies in the scripts directory
cd scripts
npm install
cd ..
```

This will install the necessary dependencies for running Lighthouse audits, including:
- lighthouse
- chrome-launcher

### 4. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Redis Configuration (for background jobs)
REDIS_URL=your_redis_url

# Security Headers API
SECURITY_HEADERS_API_KEY=your_security_headers_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the placeholder values with your actual API keys and configuration.

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project
3. Note your project URL and anon key (you'll need these for your `.env.local` file)

### 2. Set Up Database Schema

The database schema migrations are located in the `supabase/migrations` directory. You can apply them using the Supabase CLI or by running the SQL scripts directly in the Supabase SQL editor.

#### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your_project_ref

# Apply migrations
supabase db push
```

#### Using SQL Editor

1. Navigate to the SQL editor in your Supabase dashboard
2. Copy the contents of each migration file in the `supabase/migrations` directory
3. Run the SQL scripts in order (check the file names for the correct sequence)

## Stripe Setup

### 1. Create a Stripe Account

1. Go to [Stripe](https://stripe.com/) and sign up or log in
2. Get your publishable key and secret key from the Developers > API keys section
3. Add these keys to your `.env.local` file

### 2. Set Up Stripe Products and Prices

1. In the Stripe dashboard, go to Products > Add Product
2. Create a product for the Premium subscription with a price of $15/month
3. Note the price ID for use in the application

### 3. Configure Stripe Webhooks

1. In the Stripe dashboard, go to Developers > Webhooks > Add endpoint
2. Set the endpoint URL to `https://your-domain.com/api/webhooks/stripe` (use a tool like ngrok for local development)
3. Select the following events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
4. Get the webhook signing secret and add it to your `.env.local` file

## Redis Setup

Redis is used for background job processing with Bull.

### Local Development

For local development, you can run Redis using Docker:

```bash
docker run -d -p 6379:6379 redis
```

Then set `REDIS_URL=redis://localhost:6379` in your `.env.local` file.

### Production

For production, you can use a managed Redis service like Redis Labs, AWS ElastiCache, or DigitalOcean Managed Redis. Set the `REDIS_URL` environment variable to your Redis connection string.

## OpenAI Setup

1. Go to [OpenAI](https://platform.openai.com/) and sign up or log in
2. Get your API key from the API keys section
3. Add the API key to your `.env.local` file

## Security Headers API Setup

1. Go to [SecurityHeaders.com](https://securityheaders.com/) and sign up for an API key
2. Add the API key to your `.env.local` file

## Running the Application

### Development Server

```bash
npm run dev
```

This will start the Next.js development server at [http://localhost:3000](http://localhost:3000).

### Background Job Worker

In a separate terminal, start the background job worker:

```bash
npm run worker
```

This will start the Bull job worker that processes website scans in the background.

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific tests
npm test -- -t "test name"
```

### Test Environment

The test environment uses Jest and React Testing Library. Test files are located in the `src/__tests__` directory, mirroring the structure of the source code.

## Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Troubleshooting

### Common Issues

#### TypeScript Errors

If you encounter TypeScript errors, try:

```bash
npm run build:types
```

This will generate TypeScript type definitions for the project.

#### Redis Connection Issues

If you have trouble connecting to Redis, ensure that:

1. Redis is running and accessible
2. The `REDIS_URL` environment variable is correctly set
3. Your firewall allows connections to the Redis port

#### Supabase Authentication Issues

If you encounter authentication issues with Supabase:

1. Check that your Supabase URL and anon key are correct
2. Ensure that the email authentication provider is enabled in your Supabase project
3. Check the Supabase logs for any errors

#### Stripe Webhook Issues

If Stripe webhooks aren't working:

1. Ensure your webhook endpoint is publicly accessible (use ngrok for local development)
2. Check that the webhook signing secret is correct
3. Verify that you've selected the correct events to listen for
4. Check the Stripe webhook logs for any delivery attempts and failures

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Bull Documentation](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)