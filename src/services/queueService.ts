import Queue from 'bull';
import { processScan } from './scanService';

// Connection retry settings
let retryCount = 0;
let queueInitialized = false;

// Create a queue for scan processing with connection retry logic
let scanQueue: Queue.Queue | null = null;

function initializeQueue() {
  try {
    // Read the max retries and retry delay from environment variables
    const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES || '5');
    const retryDelayMs = parseInt(process.env.REDIS_RETRY_DELAY_MS || '5000');
    console.log(`Redis retry settings: maxRetries=${maxRetries}, retryDelayMs=${retryDelayMs}`);
    
    // Configuration options for the queue
    let queueOptions;
    
    // Check if REDIS_URL is provided
    if (process.env.REDIS_URL) {
      console.log(`Using REDIS_URL for connection: ${process.env.REDIS_URL.replace(/\/\/.*@/, '//***:***@')}`);
      queueOptions = {
        redis: process.env.REDIS_URL,
      };
    } else {
      // Get individual Redis connection details
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379');
      const username = process.env.REDIS_USERNAME;
      const password = process.env.REDIS_PASSWORD;
      
      // Create Redis connection options
      const redisOptions = {
        host,
        port,
        username,
        password,
        tls: host.includes('redis-cloud.com') ? { rejectUnauthorized: false } : undefined,
        connectTimeout: 30000,
        enableOfflineQueue: true,
        // Remove maxRetriesPerRequest and enableReadyCheck as they cause issues with Bull's subscriber client
      };
      
      console.log('Redis options:', JSON.stringify({
        host,
        port,
        username: username ? '(set)' : '(not set)',
        password: password ? '(set)' : '(not set)',
        tls: redisOptions.tls ? '(enabled)' : '(disabled)',
      }, null, 2));
      
      queueOptions = { redis: redisOptions };
    }
    
    console.log('Connecting to Redis...');
    
    // Create the queue with the configured options
    const newQueue = new Queue('scan-processing', {
      ...queueOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
      settings: {
        maxStalledCount: 1,
        stalledInterval: 30000,
        retryProcessDelay: 5000,
      }
    });
    
    scanQueue = newQueue;
    
    // Process jobs in the queue
    scanQueue.process(async (job) => {
      const { scanId } = job.data;
      
      try {
        job.progress(10);
        console.log(`Processing scan ${scanId}...`);
        
        // Process the scan
        const result = await processScan(scanId);
        
        job.progress(100);
        console.log(`Scan ${scanId} completed successfully`);
        
        return result;
      } catch (error: any) {
        console.error(`Scan ${scanId} failed:`, error);
        throw new Error(`Scan processing failed: ${error.message}`);
      }
    });
    
    // Add event listeners for monitoring
    scanQueue.on('completed', (job) => {
      console.log(`Job ${job.id} completed for scan ${job.data.scanId}`);
    });
    
    scanQueue.on('failed', (job, error) => {
      console.error(`Job ${job?.id} failed for scan ${job?.data.scanId}:`, error);
    });
    
    scanQueue.on('error', (error) => {
      console.error('Queue error:', error);
      
      // Attempt to reconnect regardless of environment
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Attempting to reconnect to Redis (attempt ${retryCount}/${maxRetries})...`);
        
        // Close the current queue
        scanQueue?.close().catch(err => console.error('Error closing queue:', err));
        
        // Try to reconnect after delay
        setTimeout(() => {
          initializeQueue();
        }, retryDelayMs);
      }
    });
    
    // Set up connection event handlers
    scanQueue.client.on('connect', () => {
      console.log('Connected to Redis successfully');
      retryCount = 0;
      queueInitialized = true;
    });
    
    scanQueue.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
    
  } catch (error) {
    console.error('Failed to initialize queue:', error);
    
    // Attempt to reconnect regardless of environment
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Attempting to reconnect to Redis (attempt ${retryCount}/${maxRetries})...`);
      
      // Try to reconnect after delay
      setTimeout(() => {
        initializeQueue();
      }, retryDelayMs);
    }
  }
}

// Initialize the queue
initializeQueue();

/**
 * Add a scan to the processing queue
 * @param scanId The scan ID
 * @returns The job ID
 */
export async function queueScan(scanId: string): Promise<string> {
  // Check if we're in testing mode
  const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
  
  // TESTING BYPASS: Use mock queue in testing mode when Redis is unavailable
  if (isTestingMode && (!queueInitialized || !scanQueue)) {
    console.log('TESTING MODE: Using mock queue for scan processing');
    
    // In testing mode, we'll simulate a successful queue operation
    // This allows the application to function without Redis during testing
    
    // Generate a mock job ID (same as scan ID for simplicity)
    const mockJobId = scanId;
    
    // Simulate async processing with setTimeout
    setTimeout(() => {
      console.log(`TESTING MODE: Processing mock scan ${scanId}...`);
      import('./scanService').then(({ processScan }) => {
        processScan(scanId)
          .then(() => console.log(`TESTING MODE: Mock scan ${scanId} completed`))
          .catch(error => console.error(`TESTING MODE: Mock scan ${scanId} failed:`, error));
      });
    }, 100);
    
    return mockJobId;
  }
  
  // PRODUCTION MODE: Normal queue operation
  if (!queueInitialized) {
    throw new Error('Queue not initialized. Redis connection may be unavailable.');
  }
  
  if (!scanQueue) {
    throw new Error('Queue not initialized. Redis connection may be unavailable.');
  }
  
  const job = await scanQueue.add(
    { scanId },
    {
      jobId: scanId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  );
  
  return job.id as string;
}

/**
 * Get the status of a scan job
 * @param jobId The job ID
 * @returns The job status
 */
export async function getScanJobStatus(jobId: string): Promise<{
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  error?: string;
}> {
  // Check if we're in testing mode
  const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
  
  // TESTING BYPASS: Simulate job status in testing mode when Redis is unavailable
  if (isTestingMode && (!queueInitialized || !scanQueue)) {
    console.log(`TESTING MODE: Simulating job status for ${jobId}`);
    
    // In testing mode, we'll simulate a job status
    // This allows the application to function without Redis during testing
    
    // For testing, we'll randomly determine the status
    // In a real implementation, you might want to store these in memory
    const mockStatuses = ['waiting', 'active', 'completed', 'failed'];
    const randomIndex = Math.floor(Math.random() * mockStatuses.length);
    const mockStatus = mockStatuses[randomIndex] as 'waiting' | 'active' | 'completed' | 'failed';
    
    // Generate a random progress value based on status
    let mockProgress = 0;
    if (mockStatus === 'waiting') mockProgress = 0;
    else if (mockStatus === 'active') mockProgress = Math.floor(Math.random() * 90) + 10;
    else if (mockStatus === 'completed') mockProgress = 100;
    else mockProgress = Math.floor(Math.random() * 50);
    
    return {
      status: mockStatus,
      progress: mockProgress,
      error: mockStatus === 'failed' ? 'Mock error for testing' : undefined,
    };
  }
  
  // PRODUCTION MODE: Normal job status check
  if (!queueInitialized) {
    return {
      status: 'failed',
      progress: 0,
      error: 'Queue not initialized. Redis connection may be unavailable.',
    };
  }
  
  try {
    if (!scanQueue) {
      return {
        status: 'failed',
        progress: 0,
        error: 'Queue not initialized. Redis connection may be unavailable.',
      };
    }
    
    const job = await scanQueue.getJob(jobId);
    
    if (!job) {
      return {
        status: 'failed',
        progress: 0,
        error: 'Job not found',
      };
    }
    
    const state = await job.getState();
    const progress = job.progress() || 0;
    
    let status: 'waiting' | 'active' | 'completed' | 'failed';
    
    switch (state) {
      case 'completed':
        status = 'completed';
        break;
      case 'failed':
        status = 'failed';
        break;
      case 'active':
        status = 'active';
        break;
      default:
        status = 'waiting';
    }
    
    const error = job.failedReason;
    
    return {
      status,
      progress,
      error,
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    return {
      status: 'failed',
      progress: 0,
      error: `Error retrieving job status: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Export a function to check if the queue is initialized
export function isQueueInitialized(): boolean {
  return queueInitialized;
}

// Export the queue for use in other modules
export default scanQueue;