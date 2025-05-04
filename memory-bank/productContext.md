# Product Context

## Project Overview
WebVitalAI is a project focused on web performance monitoring and optimization using AI techniques. It provides a comprehensive platform for tracking, analyzing, and improving website performance metrics, with a focus on Core Web Vitals and other key performance indicators.

## Goals
- Develop a tool for monitoring web vitals and performance metrics
- Implement AI-driven analysis for performance optimization recommendations
- Create a user-friendly interface for visualizing performance data
- Provide actionable insights to improve website performance
- Help users improve their SEO rankings through better performance
- Identify and fix security vulnerabilities

## Features
- Web vitals monitoring (LCP, FID, CLS, etc.)
- Performance metrics tracking
- AI-powered optimization suggestions
- Historical performance data visualization
- Alert system for performance degradation
- Security analysis and recommendations
- Industry benchmarks comparison
- User authentication and website management
- Subscription-based pricing model

## Target Users
- Web developers
- Performance engineers
- DevOps teams
- Website owners
- SEO specialists
- Digital marketing agencies

## Architecture
- Client Layer: Web browser interface built with Next.js
- Application Layer: Next.js API routes handling core services
- Integration Layer: Connections to external APIs (Lighthouse, axe-core, OpenAI, SecurityHeaders.com, Stripe)
- Data Layer: Supabase for authentication and data storage
- Background Processing: Scheduled jobs for automated scans and alerts

## Technologies
- Frontend: Next.js, TypeScript, TailwindCSS
- Backend: Next.js API Routes
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- Performance Testing: Lighthouse, axe-core
- AI Integration: OpenAI API
- Security Testing: SecurityHeaders.com API
- Payments: Stripe

## Data Model
Key tables in Supabase:
- Users (extended from Supabase auth)
- Websites
- Scans
- Metrics
- Issues
- Recommendations
- Subscriptions
- Alerts
- Industry Benchmarks

## Last Updated
[2025-05-04 17:56:13] - Initial creation
[2025-05-04 18:10:30] - Updated with architecture details and technologies