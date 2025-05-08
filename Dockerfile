# Use Node.js 18 as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

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

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all files
COPY . .

# Install Lighthouse dependencies in scripts directory
WORKDIR /app/scripts
RUN npm ci
WORKDIR /app

# Make scripts executable
RUN chmod +x /app/scripts/*.js
RUN chmod +x /app/scripts/*.cjs

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Puppeteer/Chrome configuration for Render
ENV CHROME_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Render-specific configuration
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_CACHE_DIR=/tmp/puppeteer-cache

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Puppeteer/Chrome configuration for Render
ENV CHROME_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Render-specific configuration
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_CACHE_DIR=/tmp/puppeteer-cache

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

# Create cache directory for Puppeteer
RUN mkdir -p /tmp/puppeteer-cache && chmod -R 777 /tmp/puppeteer-cache

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./package.json

# Copy scripts directory with Lighthouse dependencies
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Use standalone output mode
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the user to non-root
USER nextjs

# Expose the port
EXPOSE 3000

# Set the command - run setup script first, then start the server
CMD ["sh", "-c", "node ./scripts/setup-render.js && node server.js"]