import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { UsageService } from '../../usage/usage.service';
import { WebhooksService } from '../../webhooks/webhooks.service';
import { JobStatus, JobType } from '@prisma/client';
import { JobPayload } from '../queue.service';

@Processor('ai-jobs', {
  concurrency: 5, // Process up to 5 jobs concurrently
})
export class AIJobsProcessor extends WorkerHost {
  private readonly logger = new Logger(AIJobsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
    private webhooksService: WebhooksService,
  ) {
    super();
  }

  async process(job: Job<JobPayload>): Promise<any> {
    const { jobId, orgId, type, input } = job.data;

    this.logger.log(`Processing job ${jobId} of type ${type} for org ${orgId}`);

    try {
      // Update job status to PROCESSING
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.PROCESSING,
          startedAt: new Date(),
        },
      });

      // Process based on job type
      let result: any;
      let tokensUsed = 0;

      switch (type) {
        case JobType.SUMMARIZE:
          result = await this.processSummarize(input);
          tokensUsed = this.estimateTokens(input.text + result.summary);
          break;

        case JobType.CLASSIFY:
          result = await this.processClassify(input);
          tokensUsed = this.estimateTokens(input.text + result.classification);
          break;

        case JobType.SENTIMENT:
          result = await this.processSentiment(input);
          tokensUsed = this.estimateTokens(input.text);
          break;

        case JobType.TRANSLATE:
          result = await this.processTranslate(input);
          tokensUsed = this.estimateTokens(input.text + result.translation);
          break;

        case JobType.EXTRACT:
          result = await this.processExtract(input);
          tokensUsed = this.estimateTokens(input.text + JSON.stringify(result.entities));
          break;

        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      // Calculate cost (example: $0.001 per 1000 tokens)
      const costCents = Math.ceil((tokensUsed / 1000) * 0.1);

      // Update job as completed
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.SUCCEEDED,
          output: result,
          tokenUsed: tokensUsed,
          costCents,
          completedAt: new Date(),
        },
      });

      // Record token usage
      if (tokensUsed > 0) {
        await this.usageService.recordUsage(orgId, {
          tokens: tokensUsed,
          costCents,
        });
      }

      this.logger.log(
        `Job ${jobId} completed successfully. Tokens: ${tokensUsed}, Cost: $${costCents / 100}`,
      );

      // Send webhook notification for successful job completion
      try {
        await this.webhooksService.sendWebhook(orgId, 'job.completed', {
          jobId,
          type,
          status: 'SUCCEEDED',
          result,
          tokensUsed,
          costCents,
          completedAt: new Date().toISOString(),
        });
      } catch (webhookError: any) {
        this.logger.warn(`Failed to send job completion webhook: ${webhookError.message}`);
      }

      return result;
    } catch (error: any) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);

      // Update job as failed
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          error: error.message,
          completedAt: new Date(),
        },
      });

      // Send webhook notification for job failure
      try {
        await this.webhooksService.sendWebhook(orgId, 'job.failed', {
          jobId,
          type,
          status: 'FAILED',
          error: error.message,
          failedAt: new Date().toISOString(),
          attempts: job.attemptsMade + 1,
        });
      } catch (webhookError: any) {
        this.logger.warn(`Failed to send job failure webhook: ${webhookError.message}`);
      }

      throw error; // Re-throw to let BullMQ handle retries
    }
  }

  /**
   * Mock AI processing functions - Replace with actual AI API calls
   */
  private async processSummarize(input: any): Promise<any> {
    // Simulate AI processing delay
    await this.delay(1000);

    const text = input.text || '';
    const summary = text.length > 100 ? text.substring(0, 100) + '...' : text;

    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
    };
  }

  private async processClassify(input: any): Promise<any> {
    await this.delay(800);

    const categories = ['Technology', 'Business', 'Science', 'Sports', 'Entertainment'];
    const classification = categories[Math.floor(Math.random() * categories.length)];

    return {
      classification,
      confidence: 0.85 + Math.random() * 0.15,
      categories,
    };
  }

  private async processSentiment(input: any): Promise<any> {
    await this.delay(600);

    const sentiments = ['positive', 'negative', 'neutral'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

    return {
      sentiment,
      score: Math.random(),
      magnitude: Math.random(),
    };
  }

  private async processTranslate(input: any): Promise<any> {
    await this.delay(1200);

    return {
      translation: `[Translated: ${input.text}]`,
      sourceLanguage: input.from || 'en',
      targetLanguage: input.to || 'es',
    };
  }

  private async processExtract(input: any): Promise<any> {
    await this.delay(900);

    return {
      entities: [
        { type: 'PERSON', text: 'Sample Person', confidence: 0.9 },
        { type: 'LOCATION', text: 'Sample Location', confidence: 0.85 },
      ],
      count: 2,
    };
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Event handlers for monitoring
   */
  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} has completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} has failed with error: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.log(`Job ${job.id} progress: ${JSON.stringify(progress)}`);
  }
}

