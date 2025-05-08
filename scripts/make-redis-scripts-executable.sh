#!/bin/bash

# Make Redis troubleshooting scripts executable
echo "Making Redis troubleshooting scripts executable..."

# Change to the scripts directory
cd "$(dirname "$0")" || exit 1

# Make the scripts executable
chmod +x test-redis-connection.js
chmod +x fix-redis-ssl.js
chmod +x verify-redis-fix.js
chmod +x test-redis-connection.cjs
chmod +x fix-redis-ssl.cjs
chmod +x verify-redis-fix.cjs

echo "Scripts are now executable!"
echo "You can run them with:"
echo "ES Module versions:"
echo "  node scripts/test-redis-connection.js"
echo "  node scripts/fix-redis-ssl.js"
echo "  node scripts/verify-redis-fix.js"
echo ""
echo "CommonJS versions (if you encounter module errors):"
echo "  node scripts/test-redis-connection.cjs"
echo "  node scripts/fix-redis-ssl.cjs"
echo "  node scripts/verify-redis-fix.cjs"