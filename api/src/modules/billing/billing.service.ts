import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infra/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Get or create Stripe customer for an organization
   */
  async getOrCreateCustomer(orgId: string): Promise<string> {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      include: {
        memberships: {
          where: { role: 'OWNER' },
          include: { user: true },
          take: 1,
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // If customer already exists, return it
    if (org.billingCustomerId) {
      return org.billingCustomerId;
    }

    // Create new Stripe customer
    const owner = org.memberships[0]?.user;
    const customer = await this.stripe.customers.create({
      email: owner?.email || '',
      name: org.name,
      metadata: {
        orgId: org.id,
        orgSlug: org.slug,
      },
    });

    // Save customer ID
    await this.prisma.org.update({
      where: { id: orgId },
      data: { billingCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create a checkout session for upgrading to a paid plan
   */
  async createCheckoutSession(
    orgId: string,
    planTier: 'PRO' | 'ENTERPRISE',
    successUrl: string,
    cancelUrl: string,
  ) {
    const customerId = await this.getOrCreateCustomer(orgId);

    const priceId =
      planTier === 'PRO'
        ? this.configService.get<string>('STRIPE_PRO_PRICE_ID')
        : this.configService.get<string>('STRIPE_ENTERPRISE_PRICE_ID');

    if (!priceId) {
      throw new BadRequestException(`Price ID not configured for ${planTier}`);
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          orgId,
          planTier,
        },
      },
      metadata: {
        orgId,
        planTier,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Create a billing portal session for managing subscription
   */
  async createPortalSession(orgId: string, returnUrl: string) {
    const customerId = await this.getOrCreateCustomer(orgId);

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  }

  /**
   * Get billing information for an organization
   */
  async getBillingInfo(orgId: string) {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    let subscription = null;
    let upcomingInvoice = null;

    // If org has a subscription, fetch details from Stripe
    if (org.subscriptionId) {
      try {
        subscription = await this.stripe.subscriptions.retrieve(org.subscriptionId);
        
        // Get upcoming invoice
        try {
          upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
            customer: org.billingCustomerId!,
          });
        } catch (err) {
          // No upcoming invoice
        }
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      }
    }

    return {
      orgId: org.id,
      orgName: org.name,
      planTier: org.planTier,
      subscriptionStatus: org.subscriptionStatus,
      customerId: org.billingCustomerId,
      subscriptionId: org.subscriptionId,
      currentPeriodEnd: subscription?.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      upcomingInvoice: upcomingInvoice
        ? {
            amount: upcomingInvoice.amount_due,
            currency: upcomingInvoice.currency,
            date: new Date((upcomingInvoice.period_end || 0) * 1000),
          }
        : null,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // Log the event
    await this.prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        payload: event.data.object as any,
      },
    });

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await this.prisma.stripeEvent.updateMany({
      where: { eventId: event.id },
      data: { processedAt: new Date() },
    });

    return { received: true };
  }

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata.orgId;
    const planTier = subscription.metadata.planTier as 'PRO' | 'ENTERPRISE';

    if (!orgId) {
      console.error('No orgId in subscription metadata');
      return;
    }

    await this.prisma.org.update({
      where: { id: orgId },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        planTier: planTier || 'FREE',
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        orgId,
        action: 'subscription.updated',
        targetType: 'Subscription',
        targetId: subscription.id,
        metadata: {
          status: subscription.status,
          planTier,
        },
      },
    });
  }

  /**
   * Handle subscription deleted (cancelled)
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata.orgId;

    if (!orgId) {
      console.error('No orgId in subscription metadata');
      return;
    }

    // Downgrade to FREE plan
    await this.prisma.org.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: 'canceled',
        planTier: 'FREE',
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        orgId,
        action: 'subscription.canceled',
        targetType: 'Subscription',
        targetId: subscription.id,
        metadata: {
          status: 'canceled',
        },
      },
    });
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    
    // Find org by customer ID
    const org = await this.prisma.org.findFirst({
      where: { billingCustomerId: customerId },
    });

    if (!org) {
      console.error(`No org found for customer ${customerId}`);
      return;
    }

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        orgId: org.id,
        action: 'invoice.paid',
        targetType: 'Invoice',
        targetId: invoice.id,
        metadata: {
          amount: invoice.amount_paid,
          currency: invoice.currency,
          invoiceNumber: invoice.number,
          paidAt: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
        },
      },
    });
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    
    // Find org by customer ID
    const org = await this.prisma.org.findFirst({
      where: { billingCustomerId: customerId },
    });

    if (!org) {
      console.error(`No org found for customer ${customerId}`);
      return;
    }

    // Update subscription status
    await this.prisma.org.update({
      where: { id: org.id },
      data: {
        subscriptionStatus: 'past_due',
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        orgId: org.id,
        action: 'invoice.payment_failed',
        targetType: 'Invoice',
        targetId: invoice.id,
        metadata: {
          amount: invoice.amount_due,
          currency: invoice.currency,
        },
      },
    });

    // TODO: Send notification email to org owner
  }
}
