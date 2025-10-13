import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import axios, { AxiosError } from 'axios';

export interface WebhookPayload {
  webhookId: string;
  url: string;
  event: string;
  data: any;
}

@Injectable()
@Processor('webhooks', {
  concurrency: 10, // Process up to 10 webhook deliveries concurrently
})
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<WebhookPayload>): Promise<any> {
    const { webhookId, url, event, data } = job.data;

    this.logger.log(`Delivering webhook ${webhookId} to ${url} (event: ${event})`);

    try {
      // Get webhook endpoint details
      const endpoint = await this.prisma.webhookEndpoint.findUnique({
        where: { id: webhookId },
      });

      if (!endpoint) {
        throw new Error(`Webhook endpoint ${webhookId} not found`);
      }

      if (!endpoint.enabled) {
        throw new Error(`Webhook endpoint ${webhookId} is disabled`);
      }

      // Generate signature
      const payload = JSON.stringify(data);
      const signature = this.generateSignature(payload, endpoint.secret);

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-LK-Signature': signature,
        'X-LK-Event': event,
        'X-LK-Timestamp': new Date().toISOString(),
        'User-Agent': 'LaunchKit-Webhook/1.0',
      };

      // Make HTTP request
      const startTime = Date.now();
      const response = await axios.post(url, data, {
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status >= 200 && status < 300,
      });

      const duration = Date.now() - startTime;

      // Record successful delivery
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookEndpointId: webhookId,
          eventType: event,
          payload: data,
          signature,
          status: 'SUCCESS',
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts || 5,
          responseStatus: response.status,
          responseBody: response.data ? JSON.stringify(response.data) : null,
        },
      });

      // Update last delivery time on endpoint
      await this.prisma.webhookEndpoint.update({
        where: { id: webhookId },
        data: { lastDeliveryAt: new Date() },
      });

      this.logger.log(
        `Webhook ${webhookId} delivered successfully (${response.status}) in ${duration}ms`,
      );

      return {
        success: true,
        deliveryId: delivery.id,
        status: response.status,
        duration,
        attempt: job.attemptsMade + 1,
      };
    } catch (error: any) {
      const duration = Date.now() - Date.now();
      
      this.logger.error(`Webhook ${webhookId} delivery failed: ${error.message}`);

      // Determine if this is a retryable error
      const isRetryable = this.isRetryableError(error);

      // Record failed delivery
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookEndpointId: webhookId,
          eventType: event,
          payload: data,
          signature: '', // Will be empty for failed deliveries
          status: isRetryable ? 'RETRYING' : 'FAILED',
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts || 5,
          responseStatus: error.response?.status || null,
          responseBody: error.response?.data ? JSON.stringify(error.response.data) : null,
          error: error.message,
          lastAttemptAt: new Date(),
          nextAttemptAt: isRetryable ? this.getNextAttemptTime(job.attemptsMade + 1) : null,
        },
      });

      // If not retryable or max attempts reached, mark as permanently failed
      if (!isRetryable || job.attemptsMade >= (job.opts.attempts || 5) - 1) {
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { 
            status: 'FAILED',
            nextAttemptAt: null,
          },
        });
      }

      // Re-throw error to trigger BullMQ retry mechanism
      throw error;
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook verification
   */
  private generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      
      // Retry on network errors, timeouts, and 5xx server errors
      if (!status || status >= 500) {
        return true;
      }
      
      // Retry on rate limiting (429)
      if (status === 429) {
        return true;
      }
      
      // Don't retry on client errors (4xx except 429)
      if (status >= 400 && status < 500) {
        return false;
      }
    }
    
    // Retry on network/connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate next attempt time with exponential backoff
   */
  private getNextAttemptTime(attempt: number): Date {
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    return new Date(Date.now() + delay);
  }

  /**
   * Event handlers for monitoring
   */
  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Webhook delivery ${job.id} is now active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Webhook delivery ${job.id} has completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Webhook delivery ${job.id} has failed: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.log(`Webhook delivery ${job.id} progress: ${JSON.stringify(progress)}`);
  }
}
