import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Billing')
@Controller({ path: 'orgs/:orgId/billing', version: '1' })
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get billing information' })
  @ApiResponse({ status: 200, description: 'Billing info retrieved' })
  async getBillingInfo(@Param('orgId') orgId: string) {
    return this.billingService.getBillingInfo(orgId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  async createCheckout(
    @Param('orgId') orgId: string,
    @Body() body: { planTier: 'PRO' | 'ENTERPRISE'; successUrl: string; cancelUrl: string },
  ) {
    return this.billingService.createCheckoutSession(
      orgId,
      body.planTier,
      body.successUrl,
      body.cancelUrl,
    );
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Create billing portal session' })
  @ApiResponse({ status: 200, description: 'Portal session created' })
  async createPortal(
    @Param('orgId') orgId: string,
    @Body() body: { returnUrl: string },
  ) {
    return this.billingService.createPortalSession(orgId, body.returnUrl);
  }
}

// Separate controller for webhooks (no auth, raw body)
@ApiTags('Webhooks')
@Controller({ path: 'webhooks/stripe', version: '1' })
export class StripeWebhookController {
  constructor(private billingService: BillingService) {}

  @Post()
  @ApiOperation({ summary: 'Handle Stripe webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    
    if (!rawBody) {
      throw new Error('Raw body is required for webhook verification');
    }

    return this.billingService.handleWebhook(signature, rawBody);
  }
}
