#!/bin/bash

# This script makes the Chromium-related scripts executable

echo "Making Chromium scripts executable..."

# Make the scripts executable
chmod +x scripts/set-chromium-path.cjs
chmod +x scripts/install-puppeteer-deps.cjs
chmod +x scripts/run-lighthouse.cjs

echo "Scripts are now executable!"