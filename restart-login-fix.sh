#!/bin/bash

echo "Restarting application with login fix..."

# Kill any running Next.js development server
echo "Stopping any running Next.js servers..."
pkill -f "next dev" || echo "No Next.js server running"

# Wait a moment for processes to terminate
sleep 2

# Start the Next.js development server
echo "Starting Next.js server..."
npm run dev &

echo "Application restarted with login fix applied!"
echo "The login form now includes:"
echo "- Rate limiting protection with exponential backoff"
echo "- Proper refresh token error handling"
echo "- User-friendly error messages"
