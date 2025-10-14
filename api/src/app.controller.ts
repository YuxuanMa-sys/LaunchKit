import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getRoot() {
    return {
      name: 'LaunchKit AI API',
      version: '1.0.0',
      status: 'operational',
      docs: '/api/docs',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health/simple')
  @ApiOperation({ summary: 'Simple health check (no database)' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  getSimpleHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping endpoint' })
  @ApiResponse({ status: 200, description: 'Service is responding' })
  getPing() {
    return { status: 'pong', timestamp: new Date().toISOString() };
  }
}

