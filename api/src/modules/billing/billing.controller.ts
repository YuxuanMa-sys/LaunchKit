import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller({ path: 'orgs/:orgId/billing', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Get billing information' })
  async getBilling(@Param('orgId') orgId: string) {
    return this.billingService.getBillingInfo(orgId);
  }

  @Post('portal')
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  async createPortal(@Param('orgId') orgId: string) {
    return this.billingService.createPortalSession(orgId);
  }
}

