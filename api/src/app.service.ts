import { Injectable } from '@nestjs/common';
import { PrismaService } from './infra/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHealth() {
    const startTime = Date.now();
    
    // Check database connection with timeout
    try {
      // Add a timeout to prevent hanging
      const dbCheck = this.prisma.$queryRaw`SELECT 1`;
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database check timeout')), 5000)
      );
      
      await Promise.race([dbCheck, timeout]);
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
        responseTime: Date.now() - startTime,
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        environment: process.env.NODE_ENV || 'development',
      };
    }
  }
}

