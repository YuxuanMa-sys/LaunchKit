import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller({ path: 'orgs/:orgId/webhooks', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List webhook endpoints' })
  async list(@Param('orgId') orgId: string) {
    return this.webhooksService.list(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create webhook endpoint' })
  async create(@Param('orgId') orgId: string, @Body() data: { url: string }) {
    return this.webhooksService.create(orgId, data.url);
  }

  @Delete(':webhookId')
  @ApiOperation({ summary: 'Delete webhook endpoint' })
  async delete(@Param('webhookId') webhookId: string) {
    return this.webhooksService.delete(webhookId);
  }
}

