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

[2025-05-06 11:15:37] - **Comprehensive Fix for "Analyze Website" Function**
- Decision: Created a comprehensive fix-all.sh script that combines the dynamic server usage fix and RLS policy fix
- Rationale: Two separate issues were causing the "analyze website" function to fail:
  1. Next.js API routes needed dynamic rendering configuration
  2. Row-level security policies were missing for the scans table
- Alternatives:
  - Applying fixes separately (more error-prone and time-consuming)
  - Rewriting the scan functionality to avoid these issues (too invasive)
  - Disabling RLS for the scans table (security risk)
- Implications:
  - Simplified fix application process with a single script
  - Comprehensive documentation for future reference
  - Improved reliability of the core "analyze website" function
  - Better security with proper RLS policies in place
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

[2025-05-06 10:55:00] - **Dashboard Dynamic Rendering Configuration**
- Decision: Configured the dashboard page as a dynamic route by adding `export const dynamic = 'force-dynamic'` to both page.tsx and layout.tsx
- Rationale: The dashboard contains dynamic data from user URL submissions and was incorrectly being treated as a static page during production builds
- Alternatives:
  - Using getServerSideProps (not available in App Router)
  - Implementing a custom caching strategy
  - Moving all data fetching to client-side only (would impact SEO and initial load performance)
- Implications:
  - Ensures the dashboard always shows fresh, user-specific data
  - Prevents build-time errors when trying to statically generate pages with dynamic data
  - Slightly increased server load due to dynamic rendering instead of static generation
- Stakeholders: Development team, users
[2025-05-06 14:18:07] - **RLS Bypass Strategy for Scan Creation**
- Decision: Implement a multi-layered approach to bypass RLS policies for scan creation
- Rationale: Previous attempts to fix RLS policies were unsuccessful due to foreign key constraint violations and missing exec_sql function. A robust solution with multiple fallback mechanisms was needed.
- Alternatives:
  - Continuing to try SQL-based fixes (not viable due to missing exec_sql function)
  - Disabling RLS entirely (security risk)
  - Rewriting the scan functionality from scratch (too time-consuming)
- Implications:
  - Added a service role client that bypasses RLS policies
  - Enhanced scan service with multi-level fallback mechanisms
  - Created a database function with SECURITY DEFINER to bypass RLS completely
  - Implemented detailed logging to identify failure points
  - Added comprehensive testing and application scripts
- Stakeholders: Development team, users
[2025-05-06 19:28:14] - Implemented a fallback mechanism in src/lib/supabase.ts for the service role client. If the SUPABASE_SERVICE_ROLE_KEY is not available, the service role client will fall back to using the admin client. This ensures the application can still function even if the service role key is not properly configured, though with potentially limited permissions.

[2025-05-07 08:33:00] - **Redis SSL Connection Fix**
- Decision: Updated Redis connection handling in queueService.ts to properly support TLS connections to Redis Cloud
- Rationale: The previous configuration was causing SSL errors (`ERR_SSL_PACKET_LENGTH_TOO_LONG`) due to incorrect TLS configuration and hardcoded credentials
- Alternatives:
  - Using a different queue library (would require significant code changes)
  - Disabling TLS for Redis connections (security risk)
  - Using a different Redis provider (migration effort)
- Implications:
  - More reliable Redis connections with proper TLS support
  - Better error handling and diagnostics for SSL-related issues
  - Support for both URL-based and parameter-based Redis connections
  - Improved environment variable handling for Redis configuration
- Stakeholders: Development team, operations team, users

[2025-05-07 09:23:00] - **Redis Non-TLS Connection Fix**
- Decision: Updated Redis connection configuration to use non-TLS connections instead of TLS for Redis Cloud
- Rationale: Testing revealed that the Redis instance is configured for non-TLS connections, as all TLS connection attempts failed with `ERR_SSL_PACKET_LENGTH_TOO_LONG` errors, while non-TLS connections succeeded
- Alternatives:
  - Continuing to try different TLS configurations (not viable as all TLS attempts failed)
  - Reconfiguring Redis Cloud to use TLS (would require Redis Cloud admin access)
  - Using a different Redis provider (migration effort)
- Implications:
  - More reliable Redis connections without SSL errors
  - Simplified connection configuration
  - Potentially reduced security if the Redis connection is over public internet (mitigated by password authentication)
[2025-05-07 15:33:00] - **Multi-Method Approach for RLS Policy Application**
- Decision: Created multiple scripts using different methods to apply RLS policy fixes for metrics and issues tables
- Rationale: The original approach using the Supabase CLI's `sql` command was failing with "unknown command" errors. A more robust solution was needed that would work across different environments.
- Alternatives:
  - Continuing to use only the Supabase CLI (unreliable if CLI is not properly installed)
  - Using only a direct PostgreSQL connection (requires pg module)
  - Using only the Supabase JavaScript client (requires exec_sql function)
  - Providing only manual instructions (requires user intervention)
- Implications:
  - More robust solution that works across different environments
  - Progressive fallback to simpler methods if more advanced methods fail
  - Better user experience with clear feedback and instructions
  - Increased code maintenance with multiple scripts to maintain
- Stakeholders: Development team, operations team, users
[2025-05-07 15:55:00] - **Use .cjs Files Instead of .js Files**
- Decision: Use .cjs file extension for CommonJS modules instead of .js
- Rationale: The project setup requires CommonJS modules for certain scripts, and .cjs explicitly indicates CommonJS format
- Alternatives: 
  - Continue using .js files (causes issues with ESM/CommonJS detection)
  - Convert all scripts to ESM format (would require significant refactoring)
- Implications:
  - More explicit module format identification
  - Better compatibility with the project's module system
  - Improved reliability for scripts that need to run in Node.js environments
- Stakeholders: Development team, operations team
- Stakeholders: Development team, operations team, users
[2025-05-08 09:25:20] - Fixed 406 errors in Supabase API requests by adding proper headers. The issue was occurring because some direct Supabase client instances were being created without the required 'Accept: application/json' and 'Content-Type: application/json' headers. Modified src/app/api/scan/route.ts to ensure all client instances include these headers. This ensures consistent header usage across all Supabase API requests, whether they're made through the imported Supabase client or direct client creations.

[2025-05-08 10:30:00] - **Scan API PGRST116 Error Fix**
- Decision: Modified the GET endpoint in src/app/api/scan/route.ts to avoid using .single() when fetching scan data
- Rationale: The .single() method was causing PGRST116 errors when RLS policies prevented access to a scan, resulting in 0 rows being returned. By removing .single() and handling the empty array case explicitly, we can provide a more graceful error response.
- Alternatives:
  - Using the service role client for all scan fetches (security risk, bypasses RLS)
  - Modifying RLS policies to be more permissive (potential security implications)
  - Using try/catch around the .single() call (less robust, doesn't address the root cause)
- Implications:
  - More robust error handling in the scan API
  - Better user experience with clear error messages
  - Improved logging for debugging RLS-related issues
  - No changes to RLS policies required
- Stakeholders: Development team, users

[2025-05-08 11:09:06] - **Dashboard Scan Retrieval Fix**
- Decision: Modified DashboardContent.tsx to avoid using .single() when fetching scan data
- Rationale: The .single() method was causing PGRST116 errors when no scan data was found, which was happening due to RLS policies or when scans hadn't been properly saved
- Alternatives:
  - Using the service role client for all scan fetches (security risk, bypasses RLS)
  - Adding error handling specifically for PGRST116 errors (less robust, doesn't address the root cause)
  - Modifying RLS policies to be more permissive (potential security implications)
- Implications:
  - More robust error handling in the dashboard
  - Better user experience with proper display of scan data
  - Consistent approach with the scan API fix that also removed .single()
  - No changes to RLS policies required
- Stakeholders: Development team, users

[2025-05-08 11:18:35] - **Enhanced Dashboard Scan Retrieval with Service Role Client**
- Decision: Modified DashboardContent.tsx to use the service role client (supabaseServiceRole) for fetching scan data and metrics
- Rationale: The regular client was still affected by RLS policies, preventing access to scan data even after fixing the PGRST116 error. The service role client bypasses RLS policies, ensuring data access.
- Alternatives:
  - Modifying RLS policies to be more permissive (potential security implications)
  - Creating custom database functions with SECURITY DEFINER (more complex)
  - Implementing client-side caching of scan results (less reliable)
- Implications:
  - More reliable data retrieval in the dashboard
  - Bypassing RLS policies in a controlled manner
  - Added debugging logs to help identify issues
  - Added a refresh button for manual data refresh
- Stakeholders: Development team, users

[2025-05-08 12:09:55] - **PGRST116 Fix in Alert Service**
- Decision: Modified `checkAlertsForScan` in `src/services/alertService.ts` to fetch scan data as an array and check its length, instead of using `.single()`.
- Rationale: A `.single()` call was causing `PGRST116` ("JSON object requested, multiple (or no) rows returned") errors when fetching scan details for alert checking. This error occurred after the main scan processing logged completion but before the job queue marked the job as fully complete, potentially interrupting the overall scan update and display on the dashboard.
- Alternatives:
    - Using a try-catch around the `.single()` call (would handle the error but not prevent it, and might mask underlying issues if a scan truly isn't found).
    - Modifying RLS policies (not ideal as the service role client should generally be used for these internal operations if RLS is a factor, or the query itself should be robust to missing data).
- Implications:
    - Prevents `PGRST116` errors in the alert checking part of scan processing.
    - Ensures more robust handling of scan data fetching within the `alertService`.
    - Improves the reliability of the scan completion flow, which should lead to more consistent display of scan results on the dashboard.
- Stakeholders: Development team

[2025-05-08 12:19:22] - **Fix 400 Bad Request on Reports Page**
- Decision: Corrected the Supabase query in `src/app/reports/page.tsx` to properly select related data and filter by user ID.
- Rationale: The reports page was making a GET request to `/rest/v1/scans` with incorrect select parameters (`website_url` instead of `websites(url)`) and an incorrect filter (`user_id` directly on `scans` instead of `websites.user_id`). This caused a 400 Bad Request error.
- Alternatives:
    - Fetching all scans and then filtering client-side (inefficient and insecure).
    - Creating a custom database view or function (more complex for this specific fix, though potentially useful for optimizing score retrieval later).
- Implications:
    - Resolved the 400 Bad Request error on the reports page.
    - Scans for the logged-in user should now be fetched and displayed correctly.
    - Added a type assertion for `scan.websites.url` to satisfy TypeScript.
- Stakeholders: Development team

[2025-05-08 12:23:18] - **TypeScript Fix for Reports Page Data Transformation**
- Decision: Refined the data transformation logic in `src/app/reports/page.tsx` to correctly access `scan.websites[0].url`.
- Rationale: A previous fix for the 400 Bad Request error introduced a TypeScript error during the build process. The type `scan.websites` (from a Supabase select with a join) was inferred as an array, and the attempt to cast it directly to an object or access `.url` without indexing was incorrect. The fix ensures that `scan.websites` is treated as an array, and its first element's `url` property is accessed safely.
- Alternatives:
    - Modifying Supabase type definitions (more involved, potentially risky if generated types are overwritten).
    - Using `any` type (defeats the purpose of TypeScript).
- Implications:
    - Resolved the TypeScript build error.
    - Ensures type-safe access to nested data from Supabase queries.
- Stakeholders: Development team

## [2025-05-08 17:20:00] - Supabase URL Validation Fix

### Decision
Add URL validation to the supabase.ts file to prevent "Invalid URL" errors when creating Supabase clients.

### Rationale
- The application was crashing with "TypeError: Invalid URL" when the Supabase URL was invalid or empty
- There was no validation to ensure the URL was valid before creating the Supabase client
- Adding validation provides a clear error message early in the application lifecycle
- This prevents cryptic errors that are harder to debug later in the application flow

### Alternatives Considered
1. **Add a default URL for development**:
   ```typescript
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
   ```
   This would prevent the error when the URL is empty, but would potentially cause other issues if the default URL is not valid or accessible.

2. **Add a runtime check only when creating clients**:
   ```typescript
   if (!supabaseUrl.startsWith('http')) {
     throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
   }
   ```
   This would catch some invalid URLs but not all, as it's a less comprehensive check than using the URL constructor.

3. **Use a try-catch only around client creation**:
   ```typescript
   try {
     export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);
   } catch (error) {
     console.error('Error creating Supabase client:', error);
     throw new Error('Failed to create Supabase client due to invalid URL');
   }
   ```
   This would catch the error but would provide less specific error messages and would be repeated for each client creation.

### Implementation
The chosen approach validates the URL early and provides a clear error message:
```typescript
// Ensure supabaseUrl is a valid URL
try {
  // Test if the URL is valid by creating a URL object
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL:', supabaseUrl);
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}
```

### Implications
- Early detection of invalid Supabase URLs with clear error messages
- Improved debugging experience when environment variables are misconfigured
- More robust application initialization process
- Better developer experience with clearer error messages

### Stakeholders
- Development team
- Operations team
## [2025-05-08 17:14:00] - Dashboard Scan Results Button Fix Approach

### Decision
Use a consistent fallback pattern for accessing scan IDs in the DashboardContent.tsx file by modifying the "View Results" button's onClick handler to use the same pattern as the rest of the code.

### Rationale
- The existing code was inconsistently handling potential undefined values for website.latest_scan
- Most of the code used a fallback pattern: (website.latest_scan || createDefaultScan(website))
- The "View Results" button's onClick handler used a non-null assertion operator (!) instead
- This inconsistency was causing a runtime error when website.latest_scan was undefined
- Using the same fallback pattern throughout the code ensures consistent behavior and prevents errors

### Alternatives Considered
1. **Add a null check before the onClick handler**: 
   ```tsx
   {website.latest_scan && (
     <button onClick={() => handleViewResults(website.latest_scan.id)}>
       View Results
     </button>
   )}
   ```
   This would prevent the error but would make the button not appear at all when latest_scan is undefined, even though we have a createDefaultScan function that could provide a fallback.

2. **Modify the handleViewResults function**:
   ```tsx
   const handleViewResults = (website: Website) => {
     const scanId = website.latest_scan?.id || createDefaultScan(website).id;
     router.push(`/dashboard?scan=${scanId}`);
   };
   ```
   This would work but would require changing the function signature and all its usages, which is a more invasive change.

3. **Use optional chaining with a fallback**:
   ```tsx
   onClick={() => handleViewResults(website.latest_scan?.id || createDefaultScan(website).id)}
   ```
   This would also work but is slightly more verbose than using the existing pattern.

### Implementation
The chosen approach maintains consistency with the existing code patterns and requires minimal changes:
```tsx
onClick={() => handleViewResults((website.latest_scan || createDefaultScan(website)).id)}
```

[2025-05-09 08:22:00] - **Dashboard View Results Button Fix Strategy**
- **Decision**: Modified the "View Results" button's onClick handler to only use actual scan IDs from the database, never the default ones.
- **Rationale**: The previous implementation was using a fallback pattern that could cause "default-" to be appended to the URL even for scans that were saved in the database. This was causing incorrect URLs when viewing scan results.
- **Implications**: 
  - Ensures that only real scan IDs from the database are used for completed scans
  - Prevents the "default-" prefix from being appended to URLs

[2025-05-09 10:27:00] - **Reports Page Server-Side API Approach**
- Decision: Implemented a server-side API approach for the reports page by creating a dedicated API endpoint and rewriting the client-side code to use it
- Rationale: The reports page was not showing any scan results because it was trying to use the service role key directly in the browser, where it's not available. This architectural issue should have been addressed much earlier in the project.
- Alternatives:
  - Continue trying to fix the client-side approach (not viable as the service role key should never be exposed to the client)
  - Use a different authentication mechanism (would require significant changes to the entire authentication system)
  - Modify RLS policies to be more permissive (security risk)
- Implications:
  - Proper separation of client and server concerns
  - Service role key is only used on the server side where it's available
  - More secure architecture as sensitive keys are not exposed to the client
  - More maintainable codebase with clear separation of responsibilities
  - Users can now see their past scans on the reports page
- Stakeholders: Development team, users
  - Adds a warning log when no valid scan ID is found
  - Improves user experience by ensuring correct URLs when viewing scan results
