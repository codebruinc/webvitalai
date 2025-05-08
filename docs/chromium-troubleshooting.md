# Chromium Troubleshooting Guide

This document provides information about the Chromium/Puppeteer issues encountered in the WebVitalAI project and how to resolve them.

## Issue Description

The WebVitalAI project uses Chromium (via Puppeteer) to run Lighthouse and Axe audits for website scanning. However, there are several issues that can occur with the Chromium setup:

1. **Chromium Path Issue**: The system is looking for Chromium at `/Applications/Chromium.app/Contents/MacOS/Chromium` but it's not found there.
2. **Symlink Problem**: The `/opt/homebrew/bin/chromium` script is pointing to a non-existent location.
3. **Environment Variable Configuration**: The `PUPPETEER_EXECUTABLE_PATH` and `CHROME_PATH` environment variables may not be set correctly.
4. **Connection Errors**: Lighthouse fails with `connect ECONNREFUSED` errors when trying to connect to Chrome.

These issues result in failed scans and error messages like:

```
Axe audit failed: Error: Failed to launch the browser process! undefined
/opt/homebrew/bin/chromium: line 2: /Applications/Chromium.app/Contents/MacOS/Chromium: No such file or directory
```

## Solution

We've created a set of scripts to diagnose and fix these issues:

### Main Test Script

The main entry point is `scripts/run-pikasim-test.sh`, which runs all the necessary steps to fix Chromium issues and test the scan functionality with pikasim.com:

```bash
bash scripts/run-pikasim-test.sh
```

This script will:
1. Make all test scripts executable
2. Fix Chromium path issues
3. Verify the Chromium setup
4. Test the Axe audit functionality
5. Test the Lighthouse audit functionality
6. Run a full scan test against pikasim.com

### Individual Scripts

You can also run the individual scripts separately:

#### 1. Fix Chromium Path Issues

```bash
node scripts/fix-chromium-path.cjs
```

This script:
- Checks if Chromium is installed
- Finds the correct path to Chromium using multiple methods
- Creates a proper wrapper script
- Updates environment variables

#### 2. Verify Chromium Setup

```bash
node scripts/verify-chromium-setup.cjs
```

This script:
- Checks if Chromium is installed and accessible
- Verifies that the environment variables are set correctly
- Tests if Chromium can be launched

#### 3. Test Axe Audit

```bash
node scripts/test-axe-audit.cjs
```

This script:
- Tests the Axe accessibility audit functionality
- Helps diagnose issues with Puppeteer and Chromium configuration

#### 4. Test Lighthouse Audit

```bash
node scripts/test-lighthouse-audit.cjs
```

This script:
- Tests the Lighthouse audit functionality
- Helps diagnose issues with Chrome/Chromium configuration

#### 5. Run Full Scan Test

```bash
node scripts/test-pikasim-scan.cjs
```

This script:
- Verifies the current Chromium setup
- Fixes any issues with the Chromium configuration
- Runs a scan against pikasim.com
- Logs detailed information at each step
- Implements fallback mechanisms
- Verifies the results

## Common Issues and Solutions

### 1. Chromium Not Found

If Chromium is not found, the scripts will attempt to:
- Find Chromium in common locations
- Use Puppeteer's bundled Chromium
- Install Chromium via Homebrew (on macOS)

### 2. Permission Issues

If you encounter permission issues when fixing the Chromium path, the script will attempt to use sudo. You may need to enter your password.

### 3. Connection Errors

If you see connection errors like `connect ECONNREFUSED`, this usually means:
- Chrome failed to launch
- The port is already in use
- There's a firewall blocking the connection

The scripts include retry mechanisms and alternative approaches to handle these issues.

### 4. Environment Variables

The scripts will update the following environment variables in your `.env.local` file:
- `PUPPETEER_EXECUTABLE_PATH`: Path to the Chromium executable
- `CHROME_PATH`: Path to the Chrome/Chromium executable
- `USE_MOCK_RESULTS`: Set to `false` to use real audits instead of mock results

## Manual Fixes

If the automated scripts don't resolve the issues, you can try these manual steps:

1. Install Chromium:
   ```bash
   # On macOS
   brew install --cask chromium
   
   # On Ubuntu/Debian
   sudo apt-get update && sudo apt-get install -y chromium-browser
   ```

2. Set environment variables in your `.env.local` file:
   ```
   PUPPETEER_EXECUTABLE_PATH=/path/to/chromium
   CHROME_PATH=/path/to/chromium
   USE_MOCK_RESULTS=false
   ```

3. Create a wrapper script:
   ```bash
   echo '#!/bin/sh
   exec "/path/to/chromium" "$@"' > /opt/homebrew/bin/chromium
   chmod +x /opt/homebrew/bin/chromium
   ```

## Troubleshooting

If you're still experiencing issues:

1. Check the logs for detailed error messages
2. Verify that Chromium is installed and accessible
3. Check if there are any firewall or security settings blocking Chromium
4. Try running the individual test scripts to isolate the issue
5. Check if there are any port conflicts (Lighthouse uses a random port)

## Additional Resources

- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)
- [Lighthouse Documentation](https://github.com/GoogleChrome/lighthouse)
- [Axe-core Documentation](https://github.com/dequelabs/axe-core)
