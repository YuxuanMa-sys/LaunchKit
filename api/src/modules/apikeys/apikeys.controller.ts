import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiKeysService } from './apikeys.service';

@ApiTags('API Keys')
@Controller({ path: 'orgs/:orgId/api-keys', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List API keys' })
  async list(@Param('orgId') orgId: string) {
    return this.apiKeysService.list(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new API key' })
  async create(@Param('orgId') orgId: string, @Body() data: { name: string }) {
    return this.apiKeysService.create(orgId, data.name);
  }

  @Delete(':keyId')
  @ApiOperation({ summary: 'Revoke API key' })
  async revoke(@Param('keyId') keyId: string) {
    return this.apiKeysService.revoke(keyId);
  }
}

