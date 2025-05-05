# Database Migration Guide

This comprehensive guide will help you apply the necessary database migrations to fix the 500 Internal Server Error caused by missing database tables (specifically the "relation 'public.websites' does not exist" error).

## Issue Description

The application is encountering a 500 Internal Server Error because the required database tables don't exist in your Supabase instance. When the application tries to query the `websites` table (or other tables), it fails with an error like:

```
relation 'public.websites' does not exist
```

This happens when:
- You're setting up a new environment
- The database migrations haven't been applied
- The database has been reset without reapplying migrations

## Solution

We need to apply the database migrations to create all the necessary tables with the correct schema. We've created a combined migration file that includes all required tables, indexes, relationships, and security policies.

## Steps to Apply Migrations

### For Development Environment

#### 1. Access the Supabase Dashboard

1. Go to [Supabase](https://app.supabase.com/) and sign in
2. Select your project from the dashboard

#### 2. Open the SQL Editor

1. In the left sidebar, click on "SQL Editor"
2. Click "New query" to create a new SQL query

#### 3. Run the Combined Migrations

1. Open the file `supabase/combined_migrations.sql` in your local project
2. Copy the entire contents of this file
3. Paste it into the SQL Editor in the Supabase dashboard
4. Click "Run" to execute the SQL script

This will:
- Create all the necessary tables with the correct schema
- Set up the required indexes and relationships
- Configure Row Level Security policies
- Create triggers for automation

#### 4. Verify the Migration

1. In the left sidebar of the Supabase dashboard, click on "Table Editor"
2. Verify that the following tables exist:
   - `users`
   - `websites`
   - `scans`
   - `metrics`
   - `issues`
   - `recommendations`
   - `subscriptions`
   - `alerts`
   - `alert_triggers`
   - `industry_benchmarks`
   - `scorecards`
   - `agency_clients`
   - `client_invitations`

3. Check that the `subscriptions` table has a `plan_type` column (not `plan_id`)

#### 5. Restart the Application

After applying the migrations, restart your application:

```bash
npm run dev
```

### For Production Environment

#### 1. Access the Production Supabase Dashboard

1. Go to [Supabase](https://app.supabase.com/) and sign in
2. Select your production project

#### 2. Backup Your Data (If Applicable)

If you have existing data in your production database that you want to preserve:

1. In the left sidebar, click on "Database"
2. Click on "Backups"
3. Click "Create backup" and follow the instructions

#### 3. Apply the Migrations

1. In the left sidebar, click on "SQL Editor"
2. Click "New query" to create a new SQL query
3. Copy the contents of `supabase/combined_migrations.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the SQL script

#### 4. Verify the Production Migration

1. In the left sidebar, click on "Table Editor"
2. Verify that all the tables listed in the development verification step exist
3. Check that the schemas match what you expect

#### 5. Restart the Production Application

Depending on your deployment setup:

- If using Vercel: Trigger a new deployment from the Vercel dashboard
- If using a custom server: Restart your application server

## Verifying the Fix

1. Navigate to your application URL
2. Try to analyze a website by entering a URL in the form
3. Check if the analysis completes without the 500 Internal Server Error
4. Verify that data is being saved to the database by checking the Supabase Table Editor

## Troubleshooting

### Common Issues

#### 1. SQL Execution Errors

If you encounter errors when running the SQL script:

- Check for any error messages in the SQL Editor
- Make sure you're copying the entire script
- Try running the script in smaller chunks to identify the problematic section

#### 2. Permission Issues

If you see permission errors:

- Make sure you're signed in with an account that has admin access to the Supabase project
- Check that the RLS (Row Level Security) policies are correctly applied

#### 3. Still Getting "Relation Does Not Exist" Errors

If you're still seeing "relation does not exist" errors after applying migrations:

- Double-check that you ran the script in the correct Supabase project
- Verify that the tables were actually created in the Table Editor
- Check your application's connection string to ensure it's connecting to the right database
- Look for schema name issues (the tables should be in the `public` schema)

#### 4. Application Still Shows 500 Error

If your application still shows a 500 error:

- Check the server logs for detailed error messages
- Verify that your environment variables (`.env.local` or equivalent) have the correct Supabase URL and key
- Restart your application server completely
- Clear your browser cache

## Additional Notes

- The migration includes a fix for the `subscriptions` table, changing `plan_id` to `plan_type` to match the application code
- All tables include appropriate indexes for performance optimization
- Row Level Security policies are applied to protect the data
- The migrations are idempotent (can be run multiple times without causing issues) due to the use of `IF NOT EXISTS` clauses

## Maintaining Database Schema

For future schema changes:

1. Create a new migration file in the `supabase/migrations/` directory with a timestamp prefix
2. Update the `supabase/combined_migrations.sql` file to include the new changes
3. Apply the migrations using the steps outlined in this guide

This ensures that your database schema stays in sync with your application code and prevents similar errors in the future.