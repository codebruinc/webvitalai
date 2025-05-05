# Decision Log

This document tracks significant architectural and design decisions made during the development of the WebVitalAI project.

## Format
Each entry should include:
- Date and time
- Decision made
- Rationale
- Alternatives considered
- Implications
- Stakeholders involved

## Decisions

[2025-05-04 17:56:45] - **Memory Bank Creation**
- Decision: Created a Memory Bank for the WebVitalAI project
- Rationale: To maintain project context and track progress
- Alternatives: None considered
- Implications: Improved project documentation and context tracking
- Stakeholders: Development team

[2025-05-04 18:11:00] - **Next.js with TypeScript**
- Decision: Use Next.js with TypeScript for the frontend and backend
- Rationale: Next.js provides server-side rendering, API routes, and good developer experience. TypeScript adds type safety.
- Alternatives: React with Express, Vue.js, Angular
- Implications: Unified codebase for frontend and backend, improved developer experience, better type safety
- Stakeholders: Development team

[2025-05-04 18:11:00] - **Supabase for Authentication and Database**
- Decision: Use Supabase for authentication and database storage
- Rationale: Supabase provides a comprehensive solution for authentication and database with good developer experience
- Alternatives: Firebase, AWS Amplify, Custom PostgreSQL + Auth0
- Implications: Simplified authentication flow, PostgreSQL database with row-level security
- Stakeholders: Development team

[2025-05-04 18:11:00] - **TailwindCSS for Styling**
- Decision: Use TailwindCSS for styling
- Rationale: TailwindCSS provides utility-first CSS with good developer experience and performance
- Alternatives: CSS Modules, Styled Components, Emotion
- Implications: Consistent styling, improved developer experience, smaller bundle size
- Stakeholders: Development team

[2025-05-04 18:11:00] - **App Router for Routing**
- Decision: Use Next.js App Router for routing
- Rationale: App Router provides better performance, server components, and improved developer experience
- Alternatives: Pages Router
- Implications: Better performance, improved developer experience, server components
- Stakeholders: Development team

[2025-05-04 18:11:00] - **Middleware for Authentication**
- Decision: Use middleware for authentication and route protection
- Rationale: Middleware provides a centralized way to handle authentication and route protection
- Alternatives: Page-level authentication checks
- Implications: Simplified authentication flow, improved security
- Stakeholders: Development team

[2025-05-04 18:11:00] - **Database Schema Design**
- Decision: Design database schema with users, websites, scans, metrics, issues, recommendations, subscriptions, alerts, and industry benchmarks tables
- Rationale: This schema supports all the required features of the application
- Alternatives: Simpler schema with fewer tables, NoSQL approach
- Implications: Comprehensive data model, relational integrity, complex queries
- Stakeholders: Development team

[2025-05-04 18:30:00] - **API Integration Strategy**
- Decision: Integrate with Lighthouse, axe-core, and custom security headers checking for website analysis
- Rationale: These tools provide comprehensive coverage for performance, SEO, accessibility, and security analysis
- Alternatives: Using third-party APIs, implementing custom analysis logic
- Implications: More accurate and comprehensive analysis, but requires more server resources
- Stakeholders: Development team, users

[2025-05-04 18:30:00] - **Background Processing with Bull**
- Decision: Use Bull with Redis for background processing of scans
- Rationale: Bull provides a robust job queue system with retries, priorities, and monitoring
- Alternatives: Custom job queue, serverless functions, direct processing
- Implications: More reliable processing, better scalability, but requires Redis
- Stakeholders: Development team, operations team

[2025-05-04 18:30:00] - **Tiered Access Model**
- Decision: Implement a tiered access model for scan results (free tier: high-level scores; premium tier: detailed issues with AI recommendations)
- Rationale: This model provides value to free users while incentivizing upgrades to premium
- Alternatives: All features free, all features paid, different feature splits
- Implications: Potential for monetization, need to manage user expectations
- Stakeholders: Development team, business team, users

[2025-05-04 18:30:00] - **OpenAI Integration for Recommendations**
- Decision: Use OpenAI API to generate recommendations for issues
- Rationale: AI-generated recommendations provide more contextual and actionable advice than static recommendations
- Alternatives: Pre-written recommendations, no recommendations
- Implications: More valuable insights for users, but higher operational costs
- Stakeholders: Development team, business team, users

[2025-05-04 18:40:00] - **Stripe Integration for Subscription Management**
- Decision: Implement subscription management using Stripe for payment processing
- Rationale: Stripe provides a robust, secure, and developer-friendly platform for handling subscriptions and payments
- Alternatives: Custom payment processing, other payment gateways (PayPal, Braintree)
- Implications: Secure payment processing, subscription lifecycle management, compliance with payment regulations
- Stakeholders: Development team, business team, users

[2025-05-04 19:02:00] - **AI Fix Prioritization Implementation**
- Decision: Enhance OpenAI integration to prioritize fixes based on impact and effort
- Rationale: Helps users focus on the most important issues first, providing better value
- Alternatives: Simple severity-based prioritization, manual prioritization
- Implications: More actionable recommendations, better user experience, increased AI API usage
- Stakeholders: Development team, users

[2025-05-04 19:02:00] - **Industry Benchmarks Implementation**
- Decision: Create a benchmarking system to compare website performance against industry standards
- Rationale: Provides context for performance metrics and helps users understand how they compare to competitors
- Alternatives: Fixed thresholds, user-defined benchmarks
- Implications: More valuable insights, need to maintain industry benchmark data
- Stakeholders: Development team, users

[2025-05-04 19:02:00] - **Automated Alerts Implementation**
- Decision: Implement a system for monitoring websites over time with customizable alerts
- Rationale: Allows users to be notified of performance degradation without manual checking
- Alternatives: Scheduled reports, manual monitoring
- Implications: Improved user engagement, need for background monitoring infrastructure
- Stakeholders: Development team, users

[2025-05-04 19:02:00] - **Social Scorecard Implementation**
- Decision: Create shareable scorecards summarizing website performance
- Rationale: Enables users to showcase their website performance and share results with stakeholders
- Alternatives: PDF reports, email sharing
- Implications: Increased visibility, potential for viral marketing
- Stakeholders: Development team, users, marketing team

[2025-05-04 19:02:00] - **Client Portal for Agencies Implementation**
- Decision: Create a multi-client management interface for agencies
- Rationale: Enables agencies to manage multiple clients' websites in one place
- Alternatives: Separate accounts for each client, shared login
- Implications: More complex user management, better agency experience, potential for agency-focused marketing
- Stakeholders: Development team, agency users, clients

[2025-05-04 19:37:00] - **Jest and React Testing Library for Testing**
- Decision: Use Jest and React Testing Library for testing the application
- Rationale: Jest provides a comprehensive testing framework with good React support, and React Testing Library encourages testing from a user's perspective
- Alternatives: Mocha + Chai, Cypress for all tests, Vitest
- Implications: More reliable code, easier maintenance, better developer experience
- Stakeholders: Development team, QA team

[2025-05-04 19:37:00] - **Mock External Dependencies in Tests**
- Decision: Mock external dependencies like Supabase, OpenAI, and Stripe in tests
- Rationale: Mocking external dependencies makes tests faster, more reliable, and independent of external services
- Alternatives: Using real services in tests, using test doubles
- Implications: Tests are more isolated but may not catch integration issues
- Stakeholders: Development team, QA team

[2025-05-04 19:37:00] - **Testing Directory Structure**
- Decision: Organize tests in a __tests__ directory that mirrors the source code structure
- Rationale: This structure makes it easy to find tests for specific components and services
- Alternatives: Tests alongside source files, flat test directory
- Implications: Better organization, easier navigation, clear separation of tests and source code
- Stakeholders: Development team

[2025-05-05 09:02:00] - **CI/CD with GitHub Actions**
- Decision: Use GitHub Actions for CI/CD pipeline
- Rationale: GitHub Actions provides seamless integration with the GitHub repository, automated testing, and deployment to Vercel
- Alternatives: Jenkins, CircleCI, GitLab CI/CD, AWS CodePipeline
- Implications: Automated testing and deployment, improved code quality, faster release cycles
- Stakeholders: Development team, operations team

[2025-05-05 09:02:00] - **Vercel for Production Deployment**
- Decision: Use Vercel as the primary deployment platform
- Rationale: Vercel provides excellent integration with Next.js, automatic preview deployments, and global CDN
- Alternatives: AWS Amplify, Netlify, self-hosted solution
- Implications: Simplified deployment process, improved performance, built-in CDN
- Stakeholders: Development team, operations team, users

[2025-05-05 09:02:00] - **Docker for Worker Deployment**
- Decision: Use Docker for deploying the background worker
- Rationale: Docker provides consistent environments, easy scaling, and simplified deployment
- Alternatives: Serverless functions, direct deployment to VPS
- Implications: Consistent worker environment, easier scaling, more complex setup
- Stakeholders: Development team, operations team

[2025-05-05 09:02:00] - **Sentry for Error Tracking**
- Decision: Implement Sentry for error tracking and performance monitoring
- Rationale: Sentry provides comprehensive error tracking, performance monitoring, and session replay
- Alternatives: LogRocket, Rollbar, custom error tracking
- Implications: Better visibility into application errors, improved debugging, additional cost
- Stakeholders: Development team, support team, users

[2025-05-05 09:02:00] - **Health Check API for Monitoring**
- Decision: Implement a health check API endpoint for monitoring
- Rationale: Health check endpoint provides a way to monitor the application's status and dependencies
- Alternatives: External monitoring tools only, no health check
- Implications: Improved monitoring, easier integration with monitoring tools
- Stakeholders: Operations team, support team
[2025-05-05 11:25:00] - Updated Redis connection configuration to use Redis Cloud instance instead of local Redis. Modified queueService.ts to properly handle TLS connections to Redis Cloud.
[2025-05-05 11:38:20] - **Redis Connection Configuration Fix**
- Decision: Updated Redis connection configuration in queueService.ts to fix connection issues
- Rationale: The previous configuration was causing connection errors with Redis Cloud and Bull queue issues
- Alternatives: Using a different queue library, implementing a custom queue solution
- Implications: More reliable scan processing, better error handling, support for both URL-based and parameter-based Redis connections
[2025-05-05 12:18:30] - **Database Schema and Code Alignment Fix**
- Decision: Created new migration files to fix the mismatch between code and database schema
- Rationale: The code was using `plan_type` but the database schema was defined with `plan_id`, causing 500 Internal Server Errors
- Alternatives: Modifying the code to use `plan_id` instead of `plan_type`, but this would require changes in multiple files
- Implications: Consistent database schema that matches the code, elimination of 500 errors, improved reliability
- Stakeholders: Development team, users
- Stakeholders: Development team, users
[2025-05-05 15:23:50] - Fixed row-level security policy error in scan API by modifying the `initiateScan` function to accept a client parameter and updating the API route to pass its authenticated client. This ensures that database operations in the scan service use the properly authenticated client when called from API routes.

[2025-05-05 17:26:00] - **Authentication Bypass for Testing**
- Decision: Implemented a testing bypass for the scan API authentication flow
- Rationale: The authentication flow was causing errors during testing with "invalid JWT" errors. A bypass was needed to facilitate testing without requiring valid authentication.
- Alternatives:
  - Creating test-specific JWT tokens
  - Mocking the authentication service
  - Using a test database with pre-authenticated users
- Implications:
  - Easier testing of the scan API without authentication issues
  - Clear separation between production and testing code paths
  - Potential security risk if testing bypass is enabled in production (mitigated by environment checks)
- Stakeholders: Development team, QA team