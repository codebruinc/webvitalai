# System Patterns

This document tracks the architectural patterns, design decisions, and coding standards used in the WebVitalAI project.

## Architectural Patterns
[2025-05-04 18:10:45] - **Next.js App Router**: Using the Next.js App Router for routing and server components.
[2025-05-04 18:10:45] - **API Routes**: Using Next.js API routes for backend functionality.
[2025-05-04 18:10:45] - **Supabase Integration**: Using Supabase for authentication and database storage.
[2025-05-04 18:10:45] - **Client-Server Architecture**: Clear separation between client-side and server-side code.
[2025-05-04 18:10:45] - **Middleware**: Using middleware for authentication and route protection.

## Design Patterns
[2025-05-04 18:10:45] - **Component-Based Design**: Using React components for UI elements.
[2025-05-04 18:10:45] - **Custom Hooks**: Creating custom React hooks for reusable logic.
[2025-05-04 18:10:45] - **Context API**: Using React Context for state management.
[2025-05-04 18:10:45] - **Service Layer**: Abstracting external API calls into service modules.
[2025-05-04 18:10:45] - **Repository Pattern**: Using repository pattern for database access.

## Coding Standards
[2025-05-04 18:10:45] - **TypeScript**: Using TypeScript for type safety.
[2025-05-04 18:10:45] - **ESLint**: Using ESLint for code quality.
[2025-05-04 18:10:45] - **Prettier**: Using Prettier for code formatting.
[2025-05-04 18:10:45] - **TailwindCSS**: Using TailwindCSS for styling.
[2025-05-04 18:10:45] - **File Size Limit**: Keeping files under 500 lines.
[2025-05-04 18:10:45] - **Environment Variables**: Using environment variables for configuration.
[2025-05-04 18:10:45] - **No Hard-Coded Secrets**: Avoiding hard-coded secrets in the codebase.

## Data Flow Patterns
[2025-05-04 18:10:45] - **Server-Side Rendering**: Using Next.js for server-side rendering.
[2025-05-04 18:10:45] - **API-First Design**: Designing APIs before implementing UI.
[2025-05-04 18:10:45] - **Data Fetching**: Using React Query for data fetching and caching.
[2025-05-04 18:10:45] - **Form Handling**: Using React Hook Form for form handling.
[2025-05-04 18:10:45] - **Error Handling**: Consistent error handling patterns.

## Integration Patterns
[2025-05-04 18:10:45] - **External API Integration**: Using service modules for external API integration.
[2025-05-04 18:10:45] - **Authentication**: Using Supabase Auth for authentication.
[2025-05-04 18:10:45] - **Database Access**: Using Supabase client for database access.
[2025-05-04 18:10:45] - **Payment Processing**: Using Stripe for payment processing.
[2025-05-04 18:40:00] - **Subscription Management**: Using Stripe for subscription lifecycle management with webhook handling.
[2025-05-04 18:10:45] - **Background Jobs**: Using scheduled jobs for automated tasks.
[2025-05-04 18:30:00] - **Job Queue**: Using Bull with Redis for background processing.
[2025-05-04 18:30:00] - **API Orchestration**: Using a scanning service to orchestrate multiple API calls.
[2025-05-04 18:30:00] - **Tiered Access**: Implementing different levels of access based on subscription status.

## Processing Patterns
[2025-05-04 18:30:00] - **Asynchronous Processing**: Using background jobs for long-running tasks.
[2025-05-04 18:30:00] - **Retry Mechanism**: Implementing automatic retries for failed jobs.
[2025-05-04 18:30:00] - **Error Handling**: Comprehensive error handling for external API calls.
[2025-05-04 18:30:00] - **Result Normalization**: Normalizing results from different APIs into a consistent format.

## AI Integration Patterns
[2025-05-04 18:30:00] - **Prompt Engineering**: Crafting effective prompts for OpenAI API.
[2025-05-04 18:30:00] - **Context Enrichment**: Providing relevant context to AI for better recommendations.
[2025-05-04 18:30:00] - **Fallback Mechanism**: Implementing fallbacks for when AI services fail.
[2025-05-04 18:30:00] - **Response Parsing**: Structured parsing of AI responses into usable data.

## Subscription Patterns
[2025-05-04 18:40:00] - **Tiered Access Control**: Implementing access control based on subscription status.
[2025-05-04 18:40:00] - **Subscription Lifecycle Management**: Handling subscription events (creation, updates, cancellations) via webhooks.
[2025-05-04 18:40:00] - **Payment UI Integration**: Using Stripe Checkout for a secure and compliant payment flow.
[2025-05-04 18:40:00] - **Customer Portal**: Providing a Stripe Customer Portal for users to manage their subscriptions.

## Last Updated
[2025-05-04 17:56:37] - Initial creation
[2025-05-04 18:10:45] - Added architectural patterns, design patterns, coding standards, data flow patterns, and integration patterns
[2025-05-04 18:30:00] - Added job queue, API orchestration, tiered access, processing patterns, and AI integration patterns
[2025-05-04 18:40:00] - Added subscription patterns and updated integration patterns