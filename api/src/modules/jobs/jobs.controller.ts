import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@Controller({ path: 'jobs', version: '1' })
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'List all jobs for the organization' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listJobs(
    @CurrentOrg() org: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.jobsService.listJobs(
      org.id,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post('summarize')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Create summarization job' })
  async createSummarize(@CurrentOrg() org: any, @Body() data: any) {
    return this.jobsService.createJob(org.id, 'SUMMARIZE', data);
  }

  @Post('classify')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Create classification job' })
  async createClassify(@CurrentOrg() org: any, @Body() data: any) {
    return this.jobsService.createJob(org.id, 'CLASSIFY', data);
  }

  @Post('sentiment')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Create sentiment analysis job' })
  async createSentiment(@CurrentOrg() org: any, @Body() data: any) {
    return this.jobsService.createJob(org.id, 'SENTIMENT', data);
  }

  @Get(':jobId')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get job status and results' })
  async getJob(@Param('jobId') jobId: string, @CurrentOrg() org: any) {
    return this.jobsService.getJob(jobId, org.id);
  }
}

