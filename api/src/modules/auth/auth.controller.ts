import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('verify')
  @ApiOperation({ summary: 'Verify external JWT token (from Clerk/Auth0)' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  async verifyToken(@Body() body: { token: string }) {
    return this.authService.verifyExternalToken(body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User information' })
  getMe(@CurrentUser() user: any) {
    return user;
  }
}

