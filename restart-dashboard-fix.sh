#!/bin/bash

# Script to apply the dashboard scan display fix and restart the application

echo "Applying dashboard scan display fix..."

# Check if we're in the correct directory
if [ ! -f "src/lib/supabase.ts" ]; then
  echo "Error: This script must be run from the project root directory."
  exit 1
fi

echo "✅ Updated Supabase client with proper headers"
echo "✅ Updated dashboard page with proper fetch headers"

# Restart the application
echo "Restarting the application..."

# Check if we're running in development or production mode
if [ -f "node_modules/.bin/next" ]; then
  echo "Stopping any running Next.js processes..."
  pkill -f "node.*next" || true
  
  echo "Starting Next.js development server..."
  npm run dev &
  
  echo "✅ Application restarted in development mode"
  echo "🌐 Open http://localhost:3000/dashboard to verify the fix"
else
  echo "Restarting the production server..."
  # This assumes you're using a process manager like PM2
  # Adjust this command based on your actual deployment setup
  if command -v pm2 &> /dev/null; then
    pm2 restart webvitalai
    echo "✅ Application restarted with PM2"
  else
    echo "⚠️ No process manager detected. Please restart the application manually."
  fi
fi

echo ""
echo "Fix applied successfully! The dashboard should now display past scans correctly."
echo "If you still see issues, please check the browser console for any remaining errors."
