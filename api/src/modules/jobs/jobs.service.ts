import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JobType, JobStatus } from '@prisma/client';
import { UsageService } from '../usage/usage.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
    private queueService: QueueService,
  ) {}

  async createJob(orgId: string, type: JobType, input: any) {
    // Check usage limits before creating job
    const limitCheck = await this.usageService.checkLimit(orgId);
    if (!limitCheck.allowed) {
      throw new ForbiddenException(limitCheck.reason);
    }

    const job = await this.prisma.job.create({
      data: {
        orgId,
        type,
        status: JobStatus.QUEUED,
        input,
      },
    });

    // Record usage (1 job created)
    await this.usageService.recordUsage(orgId, {
      jobs: 1,
      tokens: 0, // Will be updated when job completes
      costCents: 0,
    });

    // Add to BullMQ queue for asynchronous processing
    await this.queueService.addAIJob({
      jobId: job.id,
      orgId,
      type,
      input,
    });

    return {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
    };
  }

  async getJob(jobId: string, orgId?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check ownership if orgId provided
    if (orgId && job.orgId !== orgId) {
      throw new ForbiddenException('You do not have access to this job');
    }

    // Enrich with BullMQ queue status if still processing
    if (job.status === JobStatus.QUEUED || job.status === JobStatus.PROCESSING) {
      const queueStatus = await this.queueService.getJobStatus(job.id);
      if (queueStatus) {
        return {
          ...job,
          queueState: queueStatus.state,
          queueProgress: queueStatus.progress,
          queueAttempts: queueStatus.attemptsMade,
        };
      }
    }

    return job;
  }

  async listJobs(orgId: string, limit = 50, offset = 0) {
    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.job.count({ where: { orgId } }),
    ]);

    return {
      jobs,
      total,
      limit,
      offset,
    };
  }

  /**
   * Update job with results and record token usage
   */
  async completeJob(jobId: string, output: any, tokensUsed: number = 0) {
    const job = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.SUCCEEDED,
        output,
        tokenUsed: tokensUsed,
        costCents: Math.ceil(tokensUsed * 0.001), // Example: $0.001 per 1000 tokens
        completedAt: new Date(),
      },
    });

    // Record token usage
    if (tokensUsed > 0) {
      await this.usageService.recordUsage(job.orgId, {
        tokens: tokensUsed,
        costCents: Math.ceil(tokensUsed * 0.001),
      });
    }

    return job;
  }
}

