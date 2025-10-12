import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getBillingInfo(orgId: string) {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // TODO: Fetch from Stripe

    return {
      planTier: org.planTier,
      subscriptionStatus: org.subscriptionStatus,
      customerId: org.billingCustomerId,
    };
  }

  async createPortalSession(orgId: string) {
    // TODO: Create Stripe billing portal session
    return {
      url: 'https://billing.stripe.com/session/...',
    };
  }
}

