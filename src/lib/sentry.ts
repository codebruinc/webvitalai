import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

/**
 * Initialize Sentry for error tracking
 * This should be called in the application entry point
 */
export function initSentry() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      // Sample rate for performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    });
  } else {
    console.warn('Sentry DSN not provided. Error tracking is disabled.');
  }
}

/**
 * Capture an exception with Sentry
 * @param error The error to capture
 * @param context Additional context for the error
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error:', error, context);
  }
}

/**
 * Set user information for Sentry
 * @param user User information
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  if (SENTRY_DSN) {
    Sentry.setUser(user);
  }
}

/**
 * Clear user information from Sentry
 */
export function clearUser() {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Set a tag for the current scope
 * @param key Tag key
 * @param value Tag value
 */
export function setTag(key: string, value: string) {
  if (SENTRY_DSN) {
    Sentry.setTag(key, value);
  }
}

export default Sentry;