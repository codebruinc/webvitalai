#!/bin/bash

echo "Stopping existing Node.js process..."
pkill -f "node.*next start" || true

echo "Rebuilding and restarting the application..."
npm run build && npm run start
