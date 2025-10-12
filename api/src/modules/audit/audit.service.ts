import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, filters: { action?: string; limit: number }) {
    return this.prisma.auditLog.findMany({
      where: {
        orgId,
        ...(filters.action && { action: filters.action }),
      },
      include: {
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit,
    });
  }

  async createLog(data: {
    orgId: string;
    actorUserId?: string;
    actorApiKeyId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: any;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}

