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
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        console.log('Redis URL from config:', redisUrl);
        
        if (redisUrl) {
          console.log('Using REDIS_URL for connection');
          console.log('Redis URL length:', redisUrl.length);
          return { 
            connection: redisUrl,
            defaultJobOptions: {
              removeOnComplete: 10,
              removeOnFail: 5,
            },
          };
        }
        
        console.log('Falling back to individual Redis config');
        return {
          connection: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
          },
          defaultJobOptions: {
            removeOnComplete: 10,
            removeOnFail: 5,
          },
        };
      },
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

