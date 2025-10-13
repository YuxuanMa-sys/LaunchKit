import { Module } from '@nestjs/common';
import { BillingController, StripeWebhookController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../../infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
