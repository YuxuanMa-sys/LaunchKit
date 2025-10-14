import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { MembersModule } from './modules/members/members.module';
import { ApiKeysModule } from './modules/apikeys/apikeys.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { UsageModule } from './modules/usage/usage.module';
import { BillingModule } from './modules/billing/billing.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AuditModule } from './modules/audit/audit.module';
import { QueueModule } from './modules/queue/queue.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute (global fallback)
      },
    ]),

        // Infrastructure
        PrismaModule,
        QueueModule, // BullMQ job queue
        TelemetryModule, // OpenTelemetry observability

        // Feature modules
        AuthModule,
        OrgsModule,
        MembersModule,
        ApiKeysModule,
        JobsModule,
        UsageModule,
        BillingModule,
        WebhooksModule,
        AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

