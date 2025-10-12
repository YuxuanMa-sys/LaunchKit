import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JobType, JobStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async createJob(orgId: string, type: JobType, input: any) {
    const job = await this.prisma.job.create({
      data: {
        orgId,
        type,
        status: JobStatus.QUEUED,
        input,
      },
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
}

