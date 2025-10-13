import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { UsageModule } from '../usage/usage.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [UsageModule, QueueModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}

