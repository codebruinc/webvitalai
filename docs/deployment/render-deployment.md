# Deploying WebVital AI on Render with Chromium/Puppeteer

This guide provides instructions for deploying WebVital AI on Render.com with proper Chromium/Puppeteer configuration for Lighthouse and Axe audits.

## Table of Contents

- [Overview](#overview)
- [Render Configuration](#render-configuration)
- [Chromium/Puppeteer Setup](#chromiumpuppeteer-setup)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)

## Overview

WebVital AI uses Lighthouse and Axe for web performance and accessibility audits, which require a Chromium browser. When deploying to Render.com, special configuration is needed to ensure these tools work correctly in the containerized environment.

## Render Configuration

### render.yaml

The `render.yaml` file in the project root configures the Render deployment:

```yaml
services:
  - type: web
    name: webvitalai
    env: node
    buildCommand: npm ci && npm run build
    startCommand: node server.js
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: CHROME_PATH
        value: /usr/bin/chromium-browser
      - key: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
        value: true
      - key: PUPPETEER_EXECUTABLE_PATH
        value: /usr/bin/chromium-browser
      - key: PUPPETEER_SKIP_DOWNLOAD
        value: true
      - key: PUPPETEER_CACHE_DIR
        value: /tmp/puppeteer-cache
      - key: RENDER
        value: true
    disk:
      name: puppeteer-cache
      mountPath: /tmp/puppeteer-cache
      sizeGB: 1
```

### Buildpacks

The `.buildpacks` file specifies the buildpacks needed:

```
https://github.com/heroku/heroku-buildpack-nodejs.git
https://github.com/jontewks/puppeteer-heroku-buildpack.git
```

The Puppeteer Heroku buildpack installs Chromium and its dependencies in the Render environment.

## Chromium/Puppeteer Setup

### Puppeteer Configuration

The `.puppeteerrc.cjs` file configures Puppeteer:

```javascript
module.exports = {
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || join(__dirname, '.cache', 'puppeteer'),
  skipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true',
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  browserRevision: '136.0.7103.49',
  defaultLaunchOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    headless: true
  }
};
```

### Dockerfile Configuration

The Dockerfile includes the necessary dependencies for Chromium:

```dockerfile
# Install Chrome for Lighthouse with additional dependencies for Render
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dbus \
    udev \
    ttf-opensans \
    ttf-dejavu \
    font-noto-emoji \
    fontconfig

# Set environment variables for Puppeteer/Chrome
ENV CHROME_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Setup Script

The `scripts/setup-render.js` script runs during container startup to ensure Chromium is properly configured:

```javascript
// Verify Chromium installation
let chromiumPath = '/usr/bin/chromium-browser';
try {
  if (fs.existsSync(chromiumPath)) {
    console.log(`Chromium found at ${chromiumPath}`);
  } else {
    // Try alternative paths...
  }
} catch (error) {
  console.error('Error checking Chromium installation:', error);
}

// Set environment variables
process.env.CHROME_PATH = chromiumPath;
process.env.PUPPETEER_EXECUTABLE_PATH = chromiumPath;
```

## Environment Variables

The following environment variables are used for Chromium/Puppeteer configuration:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `CHROME_PATH` | Path to the Chromium executable | `/usr/bin/chromium-browser` |
| `PUPPETEER_EXECUTABLE_PATH` | Path to the Chromium executable for Puppeteer | `/usr/bin/chromium-browser` |
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | Skip downloading Chromium during installation | `true` |
| `PUPPETEER_SKIP_DOWNLOAD` | Alternative flag to skip Chromium download | `true` |
| `PUPPETEER_CACHE_DIR` | Directory for Puppeteer cache | `/tmp/puppeteer-cache` |
| `RENDER` | Flag indicating Render environment | `true` |

## Fallback Mechanism

Both the Lighthouse and Axe services include fallback mechanisms for production environments where Chromium might not be available:

1. First, they attempt to use the Chromium browser specified by environment variables
2. If that fails, they try to use Puppeteer's bundled Chromium
3. If all browser attempts fail, they return mock results with reasonable values

This ensures that the application continues to function even if there are issues with the Chromium setup.

## Troubleshooting

### Common Issues

#### Chromium Not Found

Error: `Axe audit failed: Error: Tried to find the browser at the configured path (/usr/bin/chromium-browser), but no executable was found.`

Solutions:
- Verify that the Puppeteer buildpack is correctly installed
- Check if Chromium is installed at the expected path
- Run the setup-render.js script manually to check for alternative paths

#### Connection Refused

Error: `Failed to run Lighthouse: Error: connect ECONNREFUSED 127.0.0.1:60382`

Solutions:
- Ensure Chromium can be launched with the provided flags
- Check if there are permission issues with the Chromium executable
- Verify that the necessary dependencies are installed

### Debugging

To debug Chromium/Puppeteer issues:

1. Run the test script:
   ```bash
   npm run test:audit
   ```

2. Check the logs for detailed information about the environment and Chromium setup

3. If needed, SSH into the Render instance and run:
   ```bash
   /usr/bin/chromium-browser --version
   ```

## Testing

To test the Lighthouse and Axe services:

```bash
npm run test:audit
```

This script:
1. Checks the environment information
2. Verifies the Chromium installation
3. Tests the Lighthouse service
4. Tests the Axe service

If all tests pass, the Chromium/Puppeteer setup is working correctly.