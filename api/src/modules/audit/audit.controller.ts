import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@Controller({ path: 'orgs/:orgId/audit', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs' })
  async list(
    @Param('orgId') orgId: string,
    @Query('action') action?: string,
    @Query('limit') limit = 50
  ) {
    return this.auditService.list(orgId, { action, limit: +limit });
  }
}

