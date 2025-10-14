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
          
          // Parse the Redis URL manually
          const url = new URL(redisUrl);
          const connection = {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            password: url.password || undefined,
            username: url.username || undefined,
            // Add Railway-specific DNS configuration
            family: 4, // Force IPv4 for Railway internal DNS
            retryStrategy: (times: number) => {
              // Retry connection with exponential backoff
              if (times > 10) {
                console.error(`Redis connection failed after ${times} attempts`);
                return null; // Stop retrying
              }
              const delay = Math.min(times * 200, 2000);
              console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
              return delay;
            },
            enableReadyCheck: true,
            maxRetriesPerRequest: null, // Required for BullMQ
            // Add connection timeout
            connectTimeout: 10000,
            // Add keep alive
            keepAlive: 30000,
          };
          
          console.log('Parsed Redis connection:', connection);
          
          return { 
            connection,
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
            family: 4,
            retryStrategy: (times: number) => {
              if (times > 10) return null;
              return Math.min(times * 200, 2000);
            },
            maxRetriesPerRequest: null,
            connectTimeout: 10000,
            keepAlive: 30000,
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

