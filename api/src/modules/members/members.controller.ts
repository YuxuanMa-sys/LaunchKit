import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MembersService } from './members.service';

@ApiTags('Members')
@Controller({ path: 'orgs/:orgId/members', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'List organization members' })
  async list(@Param('orgId') orgId: string) {
    return this.membersService.listMembers(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Invite new member' })
  async invite(@Param('orgId') orgId: string, @Body() data: any) {
    return this.membersService.inviteMember(orgId, data);
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Remove member' })
  async remove(@Param('orgId') orgId: string, @Param('memberId') memberId: string) {
    return this.membersService.removeMember(memberId);
  }
}

