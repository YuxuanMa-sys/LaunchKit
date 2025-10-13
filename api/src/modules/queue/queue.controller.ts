import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { QueueService } from './queue.service';

@ApiTags('Queue Admin')
@Controller({ path: 'admin/queue', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get queue metrics' })
  async getMetrics(@Query('queue') queueName?: 'ai-jobs' | 'webhooks') {
    return this.queueService.getMetrics(queueName || 'ai-jobs');
  }

  @Get('metrics/all')
  @ApiOperation({ summary: 'Get metrics for all queues' })
  async getAllMetrics() {
    const [aiJobs, webhooks] = await Promise.all([
      this.queueService.getMetrics('ai-jobs'),
      this.queueService.getMetrics('webhooks'),
    ]);

    return {
      aiJobs,
      webhooks,
    };
  }

  @Post('pause')
  @ApiOperation({ summary: 'Pause a queue' })
  async pauseQueue(@Query('queue') queueName: 'ai-jobs' | 'webhooks') {
    await this.queueService.pauseQueue(queueName);
    return { success: true, message: `Queue ${queueName} paused` };
  }

  @Post('resume')
  @ApiOperation({ summary: 'Resume a paused queue' })
  async resumeQueue(@Query('queue') queueName: 'ai-jobs' | 'webhooks') {
    await this.queueService.resumeQueue(queueName);
    return { success: true, message: `Queue ${queueName} resumed` };
  }

  @Post('clean')
  @ApiOperation({ summary: 'Clean old jobs from queue' })
  async cleanQueue(
    @Query('queue') queueName: 'ai-jobs' | 'webhooks',
    @Query('grace') grace?: string,
  ) {
    const graceMs = grace ? parseInt(grace, 10) : 3600000; // Default 1 hour
    await this.queueService.cleanQueue(queueName, graceMs);
    return { success: true, message: `Queue ${queueName} cleaned` };
  }
}

