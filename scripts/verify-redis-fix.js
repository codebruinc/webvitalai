/**
 * Verify Redis Connection Fix
 * 
 * This script tests the Redis connection with the non-TLS configuration
 * to verify that the fix works correctly.
 */
import Redis from 'ioredis';
import { config } from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: new URL('../.env.local', import.meta.url).pathname });

console.log('Verifying Redis Connection Fix');
console.log('==============================');

// Create Redis client with non-TLS configuration
const redis = new Redis({
  host: process.env.REDIS_URL || 'redis-19373.c277.us-east-1-3.ec2.redns.redis-cloud.com',
  port: parseInt(process.env.REDIS_PORT || '19373'),
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  tls: false, // Explicitly disable TLS
  connectTimeout: 30000,
  maxRetriesPerRequest: 5
});

// Set up event handlers
redis.on('connect', () => {
  console.log('✅ Connected successfully to Redis using non-TLS connection!');
  
  // Test a simple command
  redis.ping().then(result => {
    console.log(`PING response: ${result}`);
    console.log('The Redis connection fix is working correctly!');
    
    // Clean up
    redis.quit().then(() => {
      console.log('Redis connection closed.');
      process.exit(0);
    });
  }).catch(err => {
    console.error('Error executing PING command:', err);
    process.exit(1);
  });
});

redis.on('error', (error) => {
  console.error('❌ Connection error:', error);
  
  // Log more detailed information for SSL errors
  if (error && typeof error === 'object' && error.code && typeof error.code === 'string' && error.code.includes('SSL')) {
    console.error('SSL Error Details:', {
      code: error.code,
      message: error.message,
      library: error.library,
      reason: error.reason
    });
  }
  
  process.exit(1);
});

// Wait for connection or timeout
setTimeout(() => {
  console.error('Connection timed out after 30 seconds');
  process.exit(1);
}, 30000);