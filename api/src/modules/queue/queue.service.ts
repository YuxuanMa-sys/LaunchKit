import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
// Use string literals instead of Prisma enums to avoid import issues
type JobType = 'SUMMARIZE' | 'CLASSIFY' | 'SENTIMENT' | 'EXTRACT' | 'TRANSLATE';

export interface JobPayload {
  jobId: string;
  orgId: string;
  type: JobType;
  input: any;
}

@Injectable()
export class QueueService implements OnModuleInit {
  constructor(
    @InjectQueue('ai-jobs') private aiJobsQueue: Queue,
    @InjectQueue('webhooks') private webhooksQueue: Queue,
  ) {}

  async onModuleInit() {
    console.log('QueueService initialized');
    console.log(`AI Jobs Queue: ${this.aiJobsQueue.name}`);
    console.log(`Webhooks Queue: ${this.webhooksQueue.name}`);
    
    // Add Redis connection event listeners
    const client = await this.aiJobsQueue.client;
    
    client.on('connect', () => {
      console.log('✅ Redis client connected');
    });
    
    client.on('ready', () => {
      console.log('✅ Redis client ready');
    });
    
    client.on('error', (error) => {
      console.error('❌ Redis client error:', error.message);
    });
    
    client.on('close', () => {
      console.log('⚠️  Redis client closed');
    });
    
    client.on('reconnecting', (delay: number) => {
      console.log(`🔄 Redis client reconnecting in ${delay}ms...`);
    });
    
    // Log connection configuration
    const options = client.options as any; // Cast to any to access connection properties
    console.log('Redis connection config:', {
      host: options.host,
      port: options.port,
      family: options.family,
    });
    
    // Wait for connection to be ready with retries
    try {
      console.log('Waiting for Redis connection...');
      
      // Give it up to 30 seconds to connect
      const timeout = 30000;
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        try {
          await this.aiJobsQueue.getWaitingCount();
          console.log('✅ Redis connection successful');
          return;
        } catch (error: any) {
          if (error.code === 'ENOTFOUND' || error.message.includes('ENOTFOUND')) {
            console.log(`⏳ Waiting for DNS resolution... (${Math.floor((Date.now() - startTime) / 1000)}s elapsed)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw error;
          }
        }
      }
      
      console.error('❌ Redis connection timeout after 30 seconds');
    } catch (error: any) {
      console.error('❌ Redis connection failed:', error.message);
      console.error('Error details:', {
        code: error.code,
        syscall: error.syscall,
        hostname: error.hostname,
      });
    }
  }

  /**
   * Add a job to the AI jobs queue
   */
  async addAIJob(payload: JobPayload, priority?: number): Promise<Job> {
    return this.aiJobsQueue.add(
      payload.type, // job name
      payload, // job data
      {
        jobId: payload.jobId, // Use our database ID as BullMQ job ID
        priority: priority || 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    );
  }

  /**
   * Add a webhook notification to the queue
   */
  async addWebhook(payload: {
    webhookId: string;
    url: string;
    event: string;
    data: any;
  }): Promise<Job> {
    return this.webhooksQueue.add(
      'webhook-delivery',
      payload,
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  /**
   * Get job status from BullMQ
   */
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.aiJobsQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  /**
   * Get queue metrics
   */
  async getMetrics(queueName: 'ai-jobs' | 'webhooks' = 'ai-jobs') {
    const queue = queueName === 'ai-jobs' ? this.aiJobsQueue : this.webhooksQueue;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queue: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Pause/Resume queue
   */
  async pauseQueue(queueName: 'ai-jobs' | 'webhooks') {
    const queue = queueName === 'ai-jobs' ? this.aiJobsQueue : this.webhooksQueue;
    await queue.pause();
  }

  async resumeQueue(queueName: 'ai-jobs' | 'webhooks') {
    const queue = queueName === 'ai-jobs' ? this.aiJobsQueue : this.webhooksQueue;
    await queue.resume();
  }

  /**
   * Clean old jobs
   */
  async cleanQueue(queueName: 'ai-jobs' | 'webhooks', grace: number = 3600000) {
    const queue = queueName === 'ai-jobs' ? this.aiJobsQueue : this.webhooksQueue;
    await queue.clean(grace, 100, 'completed');
    await queue.clean(grace * 24, 100, 'failed');
  }
}

