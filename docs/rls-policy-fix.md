# Understanding and Fixing Row-Level Security (RLS) Issues in WebVitalAI

## What is Row-Level Security (RLS)?

Row-Level Security (RLS) is a database security feature that restricts which rows a user can access in a database table. It's used to ensure that users can only see and modify data that they are authorized to access. In the context of WebVitalAI, RLS is used to ensure that users can only access scans for websites that they own.

## How RLS Works in Supabase

Supabase uses PostgreSQL's built-in RLS features to implement security at the database level. When RLS is enabled for a table, all operations (SELECT, INSERT, UPDATE, DELETE) are restricted by default, and you need to create policies to allow specific operations.

A policy consists of:
- A name (e.g., "Users can view their own scans")
- An operation (SELECT, INSERT, UPDATE, DELETE, or ALL)
- A USING expression (for SELECT, UPDATE, DELETE) that determines which rows are visible
- A WITH CHECK expression (for INSERT, UPDATE) that determines which values can be inserted

## The RLS Issue in WebVitalAI

The error message you're seeing indicates that the RLS policy for the `scans` table is preventing the insertion of new rows:

```
Failed to create scan: new row violates row-level security policy for table "scans"
```

This could be happening for several reasons:

1. **Missing or incorrect RLS policies**: The policies that should allow users to create scans for their websites might be missing or incorrectly configured.

2. **Authentication issues**: The `auth.uid()` function used in the RLS policies might not be returning the expected user ID.

3. **Website ownership**: The user might be trying to create a scan for a website they don't own.

4. **Service role access**: If the application is using the service role to create scans, it might not have the necessary permissions.

## The Fix

The fix involves several steps:

### 1. Ensure RLS is Enabled

First, we need to make sure RLS is enabled for the `scans` table:

```sql
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
```

### 2. Create Proper RLS Policies

Then, we need to create the proper RLS policies:

```sql
-- Create policy to allow users to view their own scans
CREATE POLICY "Users can view their own scans" ON public.scans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create policy to allow users to insert scans for websites they own
CREATE POLICY "Users can insert scans for their websites" ON public.scans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create policy to allow users to update their own scans
CREATE POLICY "Users can update their own scans" ON public.scans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create policy to allow users to delete their own scans
CREATE POLICY "Users can delete their own scans" ON public.scans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );
```

### 3. Ensure the User Exists in the Database

The RLS policies rely on the `auth.uid()` function, which returns the ID of the authenticated user. For this to work, the user must exist in the `auth.users` table. Additionally, for the website ownership check to work, the user must have a record in the `public.users` table and own at least one website in the `public.websites` table.

### 4. Set the Application to Production Mode

The application might be running in development/testing mode, which could affect how authentication and RLS work. Setting the application to production mode ensures that it's using the correct authentication flow:

```
NODE_ENV=production
TESTING_MODE=false
```

## Troubleshooting

If you're still experiencing issues after applying the fix, here are some things to check:

### 1. Check the RLS Policies

You can check the existing RLS policies for the `scans` table with the following SQL query:

```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies 
WHERE 
  tablename = 'scans' 
  AND schemaname = 'public';
```

### 2. Check the auth.uid() Function

You can check what the `auth.uid()` function returns with the following SQL query:

```sql
SELECT auth.uid();
```

This should return the ID of the authenticated user. If it returns `NULL`, there might be an issue with the authentication.

### 3. Check Website Ownership

You can check if the user owns any websites with the following SQL query:

```sql
SELECT id, url, name
FROM public.websites
WHERE user_id = auth.uid();
```

If this returns no rows, the user doesn't own any websites, which would explain why they can't create scans.

### 4. Check the Service Role

If the application is using the service role to create scans, you can check if the service role has the necessary permissions with the following SQL query:

```sql
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles
WHERE rolname = 'service_role';
```

## Conclusion

RLS is a powerful security feature that ensures users can only access data they're authorized to access. However, it requires careful configuration to work correctly. The fixes provided in this document should resolve the RLS policy issue in WebVitalAI, allowing users to create scans for websites they own.

If you're still experiencing issues after applying these fixes, please refer to the Supabase documentation on RLS for more information: [Supabase Row Level Security](https://supabase.io/docs/guides/auth/row-level-security)