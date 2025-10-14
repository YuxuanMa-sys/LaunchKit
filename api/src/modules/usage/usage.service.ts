import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

// Plan limits for usage
const PLAN_LIMITS = {
  FREE: {
    jobsPerMonth: 1000,
    tokensPerMonth: 50000,
  },
  PRO: {
    jobsPerMonth: 100000,
    tokensPerMonth: 5000000,
  },
  ENTERPRISE: {
    jobsPerMonth: -1, // Unlimited
    tokensPerMonth: -1, // Unlimited
  },
};

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record usage for an organization
   */
  async recordUsage(orgId: string, usage: { jobs?: number; tokens?: number; costCents?: number }) {
    const now = new Date();
    // Round down to the start of the current hour for aggregation
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const windowEnd = new Date(windowStart);
    windowEnd.setHours(windowEnd.getHours() + 1);

    // Upsert usage record for this hour
    const usageMeter = await this.prisma.usageMeter.upsert({
      where: {
        orgId_windowStart_windowEnd: {
          orgId,
          windowStart,
          windowEnd,
        },
      },
      create: {
        orgId,
        windowStart,
        windowEnd,
        jobs: usage.jobs || 0,
        tokens: usage.tokens || 0,
        costCents: usage.costCents || 0,
      },
      update: {
        jobs: { increment: usage.jobs || 0 },
        tokens: { increment: usage.tokens || 0 },
        costCents: { increment: usage.costCents || 0 },
      },
    });

    return usageMeter;
  }

  /**
   * Check if organization has exceeded their usage limits
   */
  async checkLimit(orgId: string): Promise<{ allowed: boolean; reason?: string; current: any; limit: any }> {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      select: { planTier: true },
    });

    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    const planTier = org.planTier as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[planTier];

    // Unlimited plans always pass
    if (limits.jobsPerMonth === -1) {
      return {
        allowed: true,
        current: { jobs: 0, tokens: 0 },
        limit: { jobs: -1, tokens: -1 },
      };
    }

    // Get current month's usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const usage = await this.prisma.usageMeter.aggregate({
      where: {
        orgId,
        windowStart: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      _sum: {
        jobs: true,
        tokens: true,
      },
    });

    const currentJobs = usage._sum.jobs || 0;
    const currentTokens = usage._sum.tokens || 0;

    // Check limits
    if (currentJobs >= limits.jobsPerMonth) {
      return {
        allowed: false,
        reason: `Monthly job limit exceeded (${currentJobs}/${limits.jobsPerMonth}). Upgrade your plan to continue.`,
        current: { jobs: currentJobs, tokens: currentTokens },
        limit: { jobs: limits.jobsPerMonth, tokens: limits.tokensPerMonth },
      };
    }

    if (currentTokens >= limits.tokensPerMonth) {
      return {
        allowed: false,
        reason: `Monthly token limit exceeded (${currentTokens}/${limits.tokensPerMonth}). Upgrade your plan to continue.`,
        current: { jobs: currentJobs, tokens: currentTokens },
        limit: { jobs: limits.jobsPerMonth, tokens: limits.tokensPerMonth },
      };
    }

    return {
      allowed: true,
      current: { jobs: currentJobs, tokens: currentTokens },
      limit: { jobs: limits.jobsPerMonth, tokens: limits.tokensPerMonth },
    };
  }

  /**
   * Get usage for a specific month
   */
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
      (acc: any, u: any) => ({
        tokens: acc.tokens + u.tokens,
        jobs: acc.jobs + u.jobs,
        costCents: acc.costCents + u.costCents,
      }),
      { tokens: 0, jobs: 0, costCents: 0 }
    );

    // Get org plan for limits
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      select: { planTier: true },
    });

    const planTier = (org?.planTier as keyof typeof PLAN_LIMITS) || 'FREE';
    const limits = PLAN_LIMITS[planTier];

    return {
      month: targetMonth,
      ...total,
      breakdown: usage,
      limits: {
        jobs: limits.jobsPerMonth,
        tokens: limits.tokensPerMonth,
      },
      usage: {
        jobs: total.jobs,
        tokens: total.tokens,
      },
      percentUsed: {
        jobs: limits.jobsPerMonth === -1 ? 0 : (total.jobs / limits.jobsPerMonth) * 100,
        tokens: limits.tokensPerMonth === -1 ? 0 : (total.tokens / limits.tokensPerMonth) * 100,
      },
    };
  }

  /**
   * Get usage analytics (daily breakdown for charts)
   */
  async getAnalytics(orgId: string, startDate: Date, endDate: Date) {
    const usage = await this.prisma.usageMeter.findMany({
      where: {
        orgId,
        windowStart: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        windowStart: 'asc',
      },
    });

    // Group by day
    const dailyUsage = new Map<string, { jobs: number; tokens: number; costCents: number }>();

    usage.forEach((u: any) => {
      const day = u.windowStart.toISOString().substring(0, 10);
      const existing = dailyUsage.get(day) || { jobs: 0, tokens: 0, costCents: 0 };
      dailyUsage.set(day, {
        jobs: existing.jobs + u.jobs,
        tokens: existing.tokens + u.tokens,
        costCents: existing.costCents + u.costCents,
      });
    });

    return Array.from(dailyUsage.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }
}

