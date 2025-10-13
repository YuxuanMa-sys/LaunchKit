import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { customAlphabet } from 'nanoid';
import { createHmac } from 'crypto';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  orgId: string;
}

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async list(orgId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgId: string, url: string) {
    const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);
    const secret = `whsec_${nanoid()}`;

    return this.prisma.webhookEndpoint.create({
      data: {
        orgId,
        url,
        secret,
      },
    });
  }

  async delete(webhookId: string) {
    return this.prisma.webhookEndpoint.delete({
      where: { id: webhookId },
    });
  }

  async update(webhookId: string, data: { url?: string; enabled?: boolean }) {
    return this.prisma.webhookEndpoint.update({
      where: { id: webhookId },
      data,
    });
  }

  /**
   * Send webhook to all enabled endpoints for an organization
   */
  async sendWebhook(orgId: string, event: string, data: any) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { 
        orgId, 
        enabled: true 
      },
    });

    if (endpoints.length === 0) {
      return { sent: 0, message: 'No webhook endpoints configured' };
    }

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      orgId,
    };

    // Add each webhook to the queue for delivery
    const deliveryPromises = endpoints.map(endpoint => 
      this.queueService.addWebhook({
        webhookId: endpoint.id,
        url: endpoint.url,
        event,
        data: payload,
      })
    );

    await Promise.all(deliveryPromises);

    return {
      sent: endpoints.length,
      message: `Webhook queued for ${endpoints.length} endpoint(s)`,
      event,
      endpoints: endpoints.map(e => ({ id: e.id, url: e.url })),
    };
  }

  /**
   * Generate webhook signature for verification
   */
  generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return signature === expectedSignature;
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(webhookId: string, limit = 50, offset = 0) {
    const [deliveries, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where: { webhookEndpointId: webhookId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.webhookDelivery.count({
        where: { webhookEndpointId: webhookId },
      }),
    ]);

    return {
      deliveries,
      total,
      limit,
      offset,
    };
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
    });

    if (!endpoint) {
      throw new Error('Webhook endpoint not found');
    }

    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      data: {
        message: 'This is a test webhook from LaunchKit',
        timestamp: new Date().toISOString(),
        webhookId: endpoint.id,
      },
      timestamp: new Date().toISOString(),
      orgId: endpoint.orgId,
    };

    // Queue the test webhook
    await this.queueService.addWebhook({
      webhookId: endpoint.id,
      url: endpoint.url,
      event: 'webhook.test',
      data: testPayload,
    });

    return {
      message: 'Test webhook queued for delivery',
      webhookId: endpoint.id,
      url: endpoint.url,
    };
  }
}

