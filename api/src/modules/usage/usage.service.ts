import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async getUsage(orgId: string, month?: string) {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const startDate = new Date(`${targetMonth}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const usage = await this.prisma.usageMeter.findMany({
      where: {
        orgId,
        windowStart: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: {
        windowStart: 'asc',
      },
    });

    const total = usage.reduce(
      (acc, u) => ({
        tokens: acc.tokens + u.tokens,
        jobs: acc.jobs + u.jobs,
        costCents: acc.costCents + u.costCents,
      }),
      { tokens: 0, jobs: 0, costCents: 0 }
    );

    return {
      month: targetMonth,
      ...total,
      breakdown: usage,
    };
  }
}

