import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JobType, JobStatus } from '@prisma/client';
import { UsageService } from '../usage/usage.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
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

    // TODO: Add to BullMQ queue

    return {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
    };
  }

  async getJob(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
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

