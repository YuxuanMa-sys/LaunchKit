import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

  @Put(':webhookId')
  @ApiOperation({ summary: 'Update webhook endpoint' })
  async update(
    @Param('webhookId') webhookId: string,
    @Body() data: { url?: string; enabled?: boolean },
  ) {
    return this.webhooksService.update(webhookId, data);
  }

  @Delete(':webhookId')
  @ApiOperation({ summary: 'Delete webhook endpoint' })
  async delete(@Param('webhookId') webhookId: string) {
    return this.webhooksService.delete(webhookId);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send webhook to all endpoints' })
  async sendWebhook(
    @Param('orgId') orgId: string,
    @Body() data: { event: string; data: any },
  ) {
    return this.webhooksService.sendWebhook(orgId, data.event, data.data);
  }

  @Post(':webhookId/test')
  @ApiOperation({ summary: 'Test webhook endpoint' })
  async testWebhook(@Param('webhookId') webhookId: string) {
    return this.webhooksService.testWebhook(webhookId);
  }

  @Get(':webhookId/deliveries')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getDeliveryHistory(
    @Param('webhookId') webhookId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.webhooksService.getDeliveryHistory(
      webhookId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}

