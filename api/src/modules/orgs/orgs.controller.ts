import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrgsService } from './orgs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Organizations')
@Controller({ path: 'orgs', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class OrgsController {
  constructor(private orgsService: OrgsService) {}

  @Get()
  @ApiOperation({ summary: 'List user organizations' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved' })
  async list(@CurrentUser() user: any) {
    return this.orgsService.findUserOrgs(user.id);
  }

  @Get(':orgId')
  @ApiOperation({ summary: 'Get organization details' })
  @ApiResponse({ status: 200, description: 'Organization found' })
  async getById(@Param('orgId') orgId: string) {
    return this.orgsService.findById(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  async create(@CurrentUser() user: any, @Body() data: any) {
    return this.orgsService.create(user.id, data);
  }

  @Patch(':orgId')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async update(@Param('orgId') orgId: string, @Body() data: any) {
    return this.orgsService.update(orgId, data);
  }
}

