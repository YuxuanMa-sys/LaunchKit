import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@Controller({ path: 'jobs', version: '1' })
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Public()
  @Post('summarize')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Create summarization job' })
  async createSummarize(@CurrentOrg() org: any, @Body() data: any) {
    return this.jobsService.createJob(org.id, 'SUMMARIZE', data);
  }

  @Public()
  @Get(':jobId')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get job status' })
  async getJob(@Param('jobId') jobId: string) {
    return this.jobsService.getJob(jobId);
  }
}

