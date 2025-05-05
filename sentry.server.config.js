// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Enable performance monitoring
  enableTracing: true,
  
  // Set environment
  environment: process.env.NODE_ENV,
  
  // Add integrations for better error tracking
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express(),
    new Sentry.Integrations.Postgres(),
  ],
  
  // Configure beforeSend to sanitize sensitive data
  beforeSend(event) {
    // Sanitize sensitive data from request bodies
    if (event.request && event.request.data) {
      // Create a deep copy of the data
      const data = JSON.parse(JSON.stringify(event.request.data));
      
      // Sanitize sensitive fields
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey', 'api_key'];
      
      // Function to recursively sanitize objects
      const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            sanitize(obj[key]);
          }
        });
      };
      
      sanitize(data);
      event.request.data = data;
    }
    
    return event;
  },
});