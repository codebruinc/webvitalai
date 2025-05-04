import Queue from 'bull';
import { processScan } from './scanService';

// Create a queue for scan processing
const scanQueue = new Queue('scan-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

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
});

/**
 * Add a scan to the processing queue
 * @param scanId The scan ID
 * @returns The job ID
 */
export async function queueScan(scanId: string): Promise<string> {
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
}

export default scanQueue;