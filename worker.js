/**
 * Worker process for handling background jobs
 * This script is used to process jobs from the Bull queue
 */

// Load environment variables
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' });

// Import the queue
const scanQueue = require('./src/services/queueService').default;

console.log('Starting WebVital AI worker process...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Redis: ${process.env.REDIS_HOST || process.env.REDIS_URL || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);

// Set up graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 * Graceful shutdown function
 */
async function shutdown() {
  console.log('Shutting down worker...');
  
  try {
    // Close the queue
    await scanQueue.close();
    console.log('Queue closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Set up health check endpoint
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // Check if queue is connected
    if (scanQueue.client.status === 'ready') {
      res.statusCode = 200;
      res.end('OK');
    } else {
      res.statusCode = 500;
      res.end('Queue not connected');
    }
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

// Start the health check server
server.listen(3000, () => {
  console.log('Health check server listening on port 3000');
});

// Log queue events
scanQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

scanQueue.on('active', (job) => {
  console.log(`Job ${job.id} started processing`);
});

scanQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully`);
});

scanQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

console.log('Worker is running and waiting for jobs...');