# Deploying WebVitalAI on Render

This document explains how to deploy WebVitalAI on Render.com, with specific focus on ensuring Lighthouse and Axe auditing works correctly.

## Overview

The application uses Puppeteer, Lighthouse, and Axe for web performance and accessibility auditing. These tools require a Chromium browser to function properly. On Render, we've implemented a solution that uses Puppeteer's bundled Chromium with Render-specific configuration.

## Implementation Details

### 1. Chromium Configuration

We've updated the code to use Puppeteer's auto-downloaded Chromium or the system Chromium based on environment variables:

- `CHROME_PATH`: Path to the Chromium executable
- `PUPPETEER_EXECUTABLE_PATH`: Path to the Chromium executable for Puppeteer
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: Set to `true` to use the system Chromium
- `PUPPETEER_CACHE_DIR`: Directory for Puppeteer to cache downloads

### 2. Dockerfile Changes

The Dockerfile has been updated to:

- Install additional dependencies required for Chromium on Alpine Linux
- Set appropriate environment variables
- Create a cache directory for Puppeteer
- Run a setup script during container startup

### 3. Render Configuration

A `render.yaml` file has been added to specify:

- Build and start commands
- Environment variables
- Disk configuration for Puppeteer cache
- Health check path

## Deployment Steps

1. Push the changes to your Git repository
2. Create a new Web Service on Render
3. Connect your repository
4. Render will automatically detect the `render.yaml` file and configure the service

## Troubleshooting

If you encounter issues with Lighthouse or Axe audits:

1. Check the logs for any errors related to Chromium
2. Verify that the environment variables are set correctly
3. Ensure that the Puppeteer cache directory exists and is writable
4. Try running the setup script manually: `node scripts/setup-render.js`

### Common Issues

#### Chromium Not Found

If you see an error like:

```
Tried to find the browser at the configured path (/usr/bin/chromium-browser), but no executable was found.
```

Check that:
- The Chromium package is installed
- The path in the environment variables is correct
- The user has permission to access the executable

#### Connection Refused

If you see an error like:

```
Failed to run Lighthouse: Error: connect ECONNREFUSED 127.0.0.1:60382
```

This usually means:
- Chrome was launched but crashed
- There's an issue with the Chrome flags
- The system is missing required dependencies

Try adding more verbose logging to the Chrome launch process to diagnose the issue.

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Puppeteer Documentation](https://pptr.dev/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)