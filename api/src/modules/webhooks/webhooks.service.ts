import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { customAlphabet } from 'nanoid';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

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
}

