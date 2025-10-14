import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { UsageService } from '../../usage/usage.service';
import { WebhooksService } from '../../webhooks/webhooks.service';
import { TelemetryService } from '../../telemetry/telemetry.service';
// Use string literals instead of Prisma enums to avoid import issues
type JobStatus = 'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
type JobType = 'SUMMARIZE' | 'CLASSIFY' | 'SENTIMENT' | 'EXTRACT' | 'TRANSLATE';
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
    private telemetryService: TelemetryService,
  ) {
    super();
  }

  async process(job: Job<JobPayload>): Promise<any> {
    const { jobId, orgId, type, input } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing job ${jobId} of type ${type} for org ${orgId}`);

    // Create telemetry span for job processing
    const span = this.telemetryService.createJobSpan(type, jobId, orgId);

    try {
      span.addEvent('job.processing.started', {
        job_type: type,
        org_id: orgId,
      });

      // Update job status to PROCESSING
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
        },
      });

      span.addEvent('job.processing.status_updated', {
        status: 'PROCESSING',
      });

      // Process based on job type
      let result: any;
      let tokensUsed = 0;

      switch (type) {
        case 'SUMMARIZE':
          result = await this.processSummarize(input);
          tokensUsed = this.estimateTokens(input.text + result.summary);
          break;

        case 'CLASSIFY':
          result = await this.processClassify(input);
          tokensUsed = this.estimateTokens(input.text + result.classification);
          break;

        case 'SENTIMENT':
          result = await this.processSentiment(input);
          tokensUsed = this.estimateTokens(input.text);
          break;

        case 'TRANSLATE':
          result = await this.processTranslate(input);
          tokensUsed = this.estimateTokens(input.text + result.translation);
          break;

        case 'EXTRACT':
          result = await this.processExtract(input);
          tokensUsed = this.estimateTokens(input.text + JSON.stringify(result.entities));
          break;

        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      span.addEvent('job.processing.ai_completed', {
        tokens_used: tokensUsed,
        result_size: JSON.stringify(result).length,
      });

      // Calculate cost (example: $0.001 per 1000 tokens)
      const costCents = Math.ceil((tokensUsed / 1000) * 0.1);

      // Update job as completed
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'SUCCEEDED',
          output: result,
          tokenUsed: tokensUsed,
          costCents,
          completedAt: new Date(),
        },
      });

      span.addEvent('job.processing.database_updated', {
        status: 'SUCCEEDED',
        cost_cents: costCents,
      });

      // Record token usage
      if (tokensUsed > 0) {
        await this.usageService.recordUsage(orgId, {
          tokens: tokensUsed,
          costCents,
        });
      }

      // Record telemetry metrics
      const duration = (Date.now() - startTime) / 1000;
      this.telemetryService.recordJobMetrics(type, duration, true, orgId, tokensUsed);

      span.setAttributes({
        'job.duration_ms': Date.now() - startTime,
        'job.tokens_used': tokensUsed,
        'job.cost_cents': costCents,
      });

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
        span.addEvent('job.processing.webhook_sent', {
          event: 'job.completed',
        });
      } catch (webhookError: any) {
        this.logger.warn(`Failed to send job completion webhook: ${webhookError.message}`);
        span.addEvent('job.processing.webhook_failed', {
          error: webhookError.message,
        });
      }

      span.setStatus({ code: 1, message: 'Job completed successfully' });
      return result;
    } catch (error: any) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);

      // Update job as failed
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error.message,
          completedAt: new Date(),
        },
      });

      // Record telemetry metrics for failed job
      const duration = (Date.now() - startTime) / 1000;
      this.telemetryService.recordJobMetrics(type, duration, false, orgId);

      span.setAttributes({
        'job.duration_ms': Date.now() - startTime,
        'job.error': error.message,
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
        span.addEvent('job.processing.webhook_sent', {
          event: 'job.failed',
        });
      } catch (webhookError: any) {
        this.logger.warn(`Failed to send job failure webhook: ${webhookError.message}`);
        span.addEvent('job.processing.webhook_failed', {
          error: webhookError.message,
        });
      }

      this.telemetryService.setSpanError(error, `Job ${jobId} failed`);
      throw error; // Re-throw to let BullMQ handle retries
    } finally {
      span.end();
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

