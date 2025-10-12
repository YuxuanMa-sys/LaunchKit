import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { UsageService } from './usage.service';

@ApiTags('Usage')
@Controller({ path: 'usage', version: '1' })
export class UsageController {
  constructor(private usageService: UsageService) {}

  @Public()
  @Get()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get usage statistics' })
  async getUsage(@CurrentOrg() org: any, @Query('month') month?: string) {
    return this.usageService.getUsage(org.id, month);
  }
}

