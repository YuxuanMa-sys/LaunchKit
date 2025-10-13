import { Controller, Get, Query, UseGuards, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { UsageService } from './usage.service';

@ApiTags('Usage')
@Controller({ path: 'usage', version: '1' })
export class UsageController {
  constructor(private usageService: UsageService) {}

  // API Key endpoint
  @Public()
  @Get()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get usage statistics (API Key)' })
  async getUsage(@CurrentOrg() org: any, @Query('month') month?: string) {
    return this.usageService.getUsage(org.id, month);
  }

  // JWT endpoint for dashboard
  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get current month usage (Dashboard)' })
  async getCurrentUsage(@CurrentOrg() org: any) {
    return this.usageService.getUsage(org.id);
  }

  // Check if organization can make more API calls
  @Public()
  @Get('check-limit')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Check usage limits' })
  async checkLimit(@CurrentOrg() org: any) {
    return this.usageService.checkLimit(org.id);
  }

  // Get analytics for charts (last 30 days)
  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get usage analytics for charts' })
  async getAnalytics(@CurrentOrg() org: any, @Query('days') days?: string) {
    const daysNum = parseInt(days || '30', 10);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    
    return this.usageService.getAnalytics(org.id, startDate, endDate);
  }
}

