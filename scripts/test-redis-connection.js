/**
 * Test script for Redis connection
 * This script tests the connection to Redis with various configurations
 * to help diagnose SSL/TLS issues
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

// Connection retry settings
const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES || '5');
const retryDelayMs = parseInt(process.env.REDIS_RETRY_DELAY_MS || '5000');

console.log('Redis Connection Test');
console.log('=====================');
console.log(`Redis retry settings: maxRetries=${maxRetries}, retryDelayMs=${retryDelayMs}`);

// Test different connection configurations
async function testConnections() {
  const configs = [
    {
      name: 'Non-TLS connection (recommended)',
      config: {
        host: process.env.REDIS_URL || 'redis-19373.c277.us-east-1-3.ec2.redns.redis-cloud.com',
        port: parseInt(process.env.REDIS_PORT || '19373'),
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        tls: false
      }
    },
    {
      name: 'Basic connection with TLS',
      config: {
        host: process.env.REDIS_URL || 'redis-19373.c277.us-east-1-3.ec2.redns.redis-cloud.com',
        port: parseInt(process.env.REDIS_PORT || '19373'),
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        tls: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Enhanced TLS configuration',
      config: {
        host: process.env.REDIS_URL || 'redis-19373.c277.us-east-1-3.ec2.redns.redis-cloud.com',
        port: parseInt(process.env.REDIS_PORT || '19373'),
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        tls: {
          rejectUnauthorized: false,
          servername: process.env.REDIS_URL || 'redis-19373.c277.us-east-1-3.ec2.redns.redis-cloud.com'
        }
      }
    },
    {
      name: 'URL-based connection',
      config: {
        url: `redis://${process.env.REDIS_USERNAME || 'default'}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_URL || 'redis-19373.c277.us-east-1-3.ec2.redns.redis-cloud.com'}:${process.env.REDIS_PORT || '19373'}`
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\nTesting: ${name}`);
    console.log('Configuration:', JSON.stringify({
      ...config,
      password: config.password ? '(hidden)' : undefined,
      url: config.url ? config.url.replace(/:[^:]*@/, ':***@') : undefined
    }, null, 2));

    const redis = new Redis(config);
    
    try {
      // Set up event handlers
      redis.on('connect', () => {
        console.log(`✅ Connected successfully with "${name}"`);
      });
      
      redis.on('error', (error) => {
        console.error(`❌ Connection error with "${name}":`, error);
        
        // Log more detailed information for SSL errors
        if (error && typeof error === 'object' && error.code && typeof error.code === 'string' && error.code.includes('SSL')) {
          console.error('SSL Error Details:', {
            code: error.code,
            message: error.message,
            library: error.library,
            reason: error.reason
          });
        }
      });
      
      // Wait for connection or error
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test a simple command
      try {
        const pong = await redis.ping();
        console.log(`PING response: ${pong}`);
      } catch (cmdError) {
        console.error('Command error:', cmdError);
      }
    } finally {
      // Clean up
      redis.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\nAll tests completed');
}

// Run the tests
testConnections().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});