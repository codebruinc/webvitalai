# WebVital AI

WebVital AI is a comprehensive web performance monitoring and optimization tool powered by artificial intelligence. It helps developers, performance engineers, and website owners track, analyze, and improve their website's performance metrics.

## Features

- **Web Vitals Monitoring**: Track Core Web Vitals (LCP, FID, CLS) and other performance metrics
- **AI-Powered Recommendations**: Get intelligent suggestions to improve your website's performance
- **Performance History**: View historical performance data to track improvements over time
- **Alerts & Notifications**: Receive alerts when performance metrics degrade
- **Security Analysis**: Identify security vulnerabilities in your website
- **Industry Benchmarks**: Compare your website's performance against industry standards

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Performance Testing**: Lighthouse, axe-core
- **AI Integration**: OpenAI API
- **Security Testing**: SecurityHeaders.com API
- **Payments**: Stripe

## Project Structure

```
webvitalai/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API Routes
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── login/            # Authentication pages
│   │   └── ...
│   ├── components/           # React components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── layout/           # Layout components
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── models/               # Data models
│   ├── services/             # Service integrations
│   ├── styles/               # Global styles
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── supabase/                 # Supabase configuration and migrations
├── public/                   # Static assets
└── ...
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- OpenAI API key (for AI recommendations)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/webvitalai.git
   cd webvitalai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase URL and anon key
   - Add your OpenAI API key

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Environment Modes

WebVitalAI supports two distinct environment modes: **Testing** and **Production**. Understanding and properly configuring these modes is crucial for development, testing, and deployment.

### Testing Mode vs. Production Mode

| Feature | Testing Mode | Production Mode |
|---------|-------------|-----------------|
| Environment | Development | Production |
| Mock Data | Enabled | Disabled |
| API Bypass | Available | Blocked |
| Console Logs | Verbose | Minimal |
| Redis | Optional | Required |
| Performance | Development-optimized | Production-optimized |

### Switching Between Modes

#### To Switch to Production Mode:

```bash
# Run the production mode setup script
node set-production-mode.js

# Rebuild and restart the application
npm run build && npm run start
```

#### To Switch to Testing Mode:

```bash
# Copy the testing environment file
cp .env.test .env.local

# Restart the development server
npm run dev
```

### Verifying Mode Configuration

We provide a verification script to ensure your environment is properly configured:

```bash
# Make the script executable
chmod +x scripts/verify-production-mode.js

# Run the verification script
node scripts/verify-production-mode.js
```

The script checks:
1. Correct environment variable configuration
2. No testing code runs in production
3. API endpoints return appropriate responses
4. No testing console logs appear in production

## Troubleshooting

### "Analyze Website" Function Issues

If you encounter issues with the "analyze website" function, we've provided a comprehensive fix that addresses:

1. Next.js dynamic server usage issues
2. Row-level security (RLS) policy issues for the scans table

To apply the fix:

```bash
# Make the script executable
chmod +x fix-all.sh

# Run the comprehensive fix script
./fix-all.sh

# Restart your application
npm run build && npm run start
```

For detailed information about the issues and fixes, see:
- [Comprehensive Fix Guide](docs/comprehensive-fix.md)
- [RLS Policy Fix](docs/rls-policy-fix.md)
- [RLS Bypass Fix](docs/rls-bypass-fix.md)
- [FIX-INSTRUCTIONS.md](FIX-INSTRUCTIONS.md)

### RLS Bypass Solution

If you're experiencing issues with scan creation due to RLS policies, we've implemented a robust bypass solution:

```bash
# Make the script executable
chmod +x apply-rls-bypass-fix.sh

# Run the RLS bypass fix script
./apply-rls-bypass-fix.sh
```

To verify the solution works correctly:

```bash
# Run the comprehensive verification script
./verify-rls-bypass-fix.js
```

For detailed information about the verification process, see:
- [RLS Bypass Verification](docs/rls-bypass-verification.md)

### Redis SSL Connection Issues

If you encounter SSL errors when using the "analyze website" function, such as `ERR_SSL_PACKET_LENGTH_TOO_LONG`, it's likely due to Redis connection issues. We've provided tools to fix these problems:

```bash
# Test your Redis connection to diagnose issues (ES Module version)
node scripts/test-redis-connection.js

# OR use the CommonJS version if you encounter module errors
node scripts/test-redis-connection.cjs

# Run the Redis SSL fix script to update your configuration (ES Module version)
node scripts/fix-redis-ssl.js

# OR use the CommonJS version if you encounter module errors
node scripts/fix-redis-ssl.cjs

# Make the scripts executable (if needed)
chmod +x scripts/make-redis-scripts-executable.sh
./scripts/make-redis-scripts-executable.sh
```

For detailed information about Redis SSL issues and solutions, see:
- [Redis SSL Troubleshooting Guide](docs/redis-ssl-troubleshooting.md)
