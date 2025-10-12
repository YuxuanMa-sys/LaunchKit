import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './apikeys.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateApiKeyDto } from './dto/create-apikey.dto';

@ApiTags('API Keys')
@Controller({ path: 'api-keys', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List all API keys for user organizations' })
  async listKeys(@CurrentUser() user: any) {
    return this.apiKeysService.listKeys(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  async createKey(
    @CurrentUser() user: any,
    @Body() createKeyDto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.createKey(user.userId, createKeyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  async revokeKey(@CurrentUser() user: any, @Param('id') id: string) {
    await this.apiKeysService.revokeKey(user.userId, id);
  }
}
