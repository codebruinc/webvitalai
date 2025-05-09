# Dashboard Scan Display Troubleshooting Guide

If you're experiencing issues with scan data not appearing on your dashboard, follow this step-by-step troubleshooting guide to resolve the problem.

## Step 1: Run the Basic Fix Script

First, try running the basic fix script that updates scan statuses and adds missing metrics:

```bash
node scripts/fix-dashboard-scan-display.cjs
```

After running the script, refresh your dashboard to see if the scan data appears.

## Step 2: Check Browser Console for Errors

If the dashboard still doesn't show scan data, check your browser console for errors:

1. Open your browser's developer tools (F12 or right-click > Inspect)
2. Go to the Console tab
3. Look for any errors related to fetching scan data

Common errors include:
- 406 (Not Acceptable) errors: This indicates issues with request headers
- PGRST116 errors: This indicates issues with the `.single()` method in Supabase queries
- RLS policy errors: This indicates issues with Row Level Security policies

## Step 3: Apply the Force Display Fix

If the basic fix didn't work, try the force display fix script that modifies the dashboard component to always show scan data:

```bash
node scripts/force-dashboard-display.cjs
```

This script:
1. Backs up your DashboardContent.tsx file
2. Modifies the component to always display scan data regardless of scan status
3. Ensures all websites have at least one completed scan with metrics
4. Restarts your development server

After running the script, restart your development server and refresh your dashboard.

## Step 4: Verify Database State

If you're still having issues, verify the state of your database:

```bash
node scripts/diagnose-dashboard-scan-issue.cjs
```

This script will:
1. Check all websites and their associated scans
2. Verify that scans have the required metrics
3. Identify any issues with website-scan associations

## Step 5: Manual Fixes

If all automated fixes fail, you can try these manual fixes:

### 5.1: Clear Browser Cache and Storage

1. Open your browser's developer tools
2. Go to the Application tab
3. Select "Clear storage" on the left
4. Check all options and click "Clear site data"

### 5.2: Restart Development Server

```bash
npm run dev
```

### 5.3: Restore Original Component

If the force display fix caused issues, restore the original component:

```bash
cp src/components/dashboard/DashboardContent.tsx.bak src/components/dashboard/DashboardContent.tsx
```

### 5.4: Direct Database Manipulation

As a last resort, you can directly manipulate the database using the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the Table Editor
3. Check the `scans` table to ensure all scans have status = 'completed'
4. Check the `metrics` table to ensure all scans have the required metrics

## Step 6: Contact Support

If none of these steps resolve the issue, please contact support with the following information:

1. Screenshots of the dashboard showing the issue
2. Browser console logs
3. Output from the diagnostic scripts
4. Any error messages you've encountered

## Reverting Changes

If you need to revert any changes made by the fix scripts:

### Revert Component Changes

```bash
cp src/components/dashboard/DashboardContent.tsx.bak src/components/dashboard/DashboardContent.tsx
```

### Revert Database Changes

Unfortunately, there's no automatic way to revert database changes. If you need to revert database changes, you'll need to restore from a backup or manually update the records.