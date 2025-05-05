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
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express(),
        new Sentry.Integrations.Postgres(),
      ],
      // Performance monitoring
      enableTracing: true,
      // Session replay for debugging UI issues
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
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
 * Start a new transaction for performance monitoring
 * @param name Transaction name
 * @param op Operation type
 * @returns Transaction object
 */
export function startTransaction(name: string, op: string) {
  if (SENTRY_DSN) {
    return Sentry.startTransaction({
      name,
      op,
    });
  }
  return null;
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