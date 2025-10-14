import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { AIJobsProcessor } from './processors/ai-jobs.processor';
import { WebhookProcessor } from './processors/webhook.processor';
import { UsageModule } from '../usage/usage.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          // Alternatively, use REDIS_URL if provided
          // You can parse it or use ioredis URL format directly
        },
      }),
      inject: [ConfigService],
    }),
    // Register specific queues
    BullModule.registerQueue(
      {
        name: 'ai-jobs',
      },
      {
        name: 'webhooks',
      },
    ),
    UsageModule, // For recording usage in processor
    forwardRef(() => WebhooksModule), // For sending webhook notifications
    TelemetryModule, // For observability and metrics
  ],
  controllers: [QueueController],
  providers: [QueueService, AIJobsProcessor, WebhookProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}

