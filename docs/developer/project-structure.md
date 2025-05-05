# Project Structure

WebVital AI is built using Next.js with TypeScript, following a modular architecture that separates concerns and promotes maintainability. This document provides an overview of the project structure and organization.

## Directory Structure

```
webvitalai/
├── src/                    # Source code
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── services/           # Service modules for external APIs
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript type definitions
│   └── middleware.ts       # Next.js middleware
├── public/                 # Static assets
├── scripts/                # Utility scripts
│   ├── lighthouse-wrapper.cjs  # CommonJS wrapper for Lighthouse
│   ├── lighthouse-wrapper.js   # ESM wrapper for Lighthouse
│   └── run-lighthouse.js       # ESM script to run Lighthouse
├── supabase/               # Supabase migrations and configuration
│   └── migrations/         # Database migration files
├── docs/                   # Documentation
├── coverage/               # Test coverage reports
└── configuration files     # Various configuration files
```

## Key Directories and Files

### `/src/app`

Contains the Next.js App Router pages. Each folder represents a route in the application.

```
app/
├── layout.tsx              # Root layout component
├── page.tsx                # Homepage
├── agency/                 # Agency client management
├── alerts/                 # Alerts management
├── api/                    # API routes
│   ├── scan/               # Scan-related API endpoints
│   ├── subscriptions/      # Subscription-related API endpoints
│   └── webhooks/           # Webhook handlers
├── dashboard/              # Dashboard page
├── invitation/             # Client invitation handling
├── login/                  # Login page
├── pricing/                # Pricing page
├── scorecard/              # Social scorecard
├── settings/               # User settings
└── signup/                 # Signup page
```

### `/src/components`

Contains React components organized by feature or page.

```
components/
├── agency/                 # Agency-related components
│   ├── ClientInvitation.tsx
│   └── ClientList.tsx
├── alerts/                 # Alert-related components
│   └── AlertManager.tsx
├── auth/                   # Authentication components
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
├── dashboard/              # Dashboard components
│   ├── DashboardContent.tsx
│   ├── IndustryBenchmarks.tsx
│   ├── LoadingState.tsx
│   ├── PrioritizedRecommendations.tsx
│   └── ScanResults.tsx
├── home/                   # Homepage components
│   └── UrlForm.tsx
├── layout/                 # Layout components
│   ├── Footer.tsx
│   ├── Header.tsx
│   └── Layout.tsx
├── scorecard/              # Scorecard components
│   └── SocialScorecard.tsx
└── subscription/           # Subscription components
    └── SubscriptionManager.tsx
```

### `/src/hooks`

Contains custom React hooks for reusable logic.

```
hooks/
├── useAuth.ts              # Authentication hook
└── useSubscription.ts      # Subscription management hook
```

### `/src/services`

Contains service modules that handle external API interactions.

```
services/
├── agencyService.ts        # Agency management service
├── alertService.ts         # Alert management service
├── axeService.ts           # axe-core integration service
├── benchmarkService.ts     # Industry benchmarks service
├── lighthouseService.ts    # Lighthouse integration service (see [Lighthouse Integration](./lighthouse-integration.md))
├── openaiService.ts        # OpenAI integration service
├── queueService.ts         # Background job queue service
├── scanService.ts          # Scan orchestration service
├── scorecardService.ts     # Social scorecard service
├── securityHeadersService.ts # Security headers checking service
└── stripeService.ts        # Stripe integration service
```

### `/src/lib`

Contains utility libraries and configuration.

```
lib/
└── supabase.ts            # Supabase client configuration
```

### `/src/types`

Contains TypeScript type definitions.

```
types/
├── jest.d.ts              # Jest type definitions
└── supabase.ts            # Supabase type definitions
```

### `/supabase`

Contains Supabase migrations and configuration.

```
supabase/
└── migrations/
    ├── 20250504_initial_schema.sql    # Initial database schema
    └── 20250504_add_subscriptions.sql # Subscription-related schema
```

## Configuration Files

- `next.config.js`: Next.js configuration
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS configuration
- `jest.config.js`: Jest configuration
- `jest.setup.js`: Jest setup file
- `.env.local`: Environment variables (not committed to version control)

## Architectural Patterns

### Next.js App Router

The project uses Next.js App Router for routing and server components. Each route is represented by a folder in the `/src/app` directory, with a `page.tsx` file defining the route's content.

### API Routes

Backend functionality is implemented using Next.js API routes in the `/src/app/api` directory. These routes handle requests for scanning websites, managing subscriptions, and processing webhooks.

### Service Layer

External API interactions are abstracted into service modules in the `/src/services` directory. This provides a clean separation of concerns and makes it easier to mock external dependencies in tests.

### Component-Based Design

The UI is built using React components organized by feature or page. Components are designed to be reusable and composable.

### Custom Hooks

Reusable logic is extracted into custom React hooks in the `/src/hooks` directory. This promotes code reuse and separation of concerns.

### TypeScript

The project uses TypeScript for type safety and improved developer experience. Type definitions are stored in the `/src/types` directory.

### Testing

Tests are organized in a `__tests__` directory that mirrors the source code structure. The project uses Jest and React Testing Library for testing.

## Data Flow

1. User interacts with a component (e.g., submits a URL for scanning)
2. Component calls a service function
3. Service function makes API requests (either to internal API routes or external APIs)
4. API routes process requests and interact with the database or external services
5. Results are returned to the component for display

This separation of concerns makes the codebase more maintainable and testable.

## Special Integrations

### Lighthouse Integration

The project uses a specialized architecture for Lighthouse integration to overcome ESM compatibility challenges with Next.js. See the [Lighthouse Integration](./lighthouse-integration.md) documentation for details on:

- The architecture using separate processes
- The dual module system approach (ESM and CommonJS)
- File-based communication between processes
- Error handling and path resolution