import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../infra/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('API key required');
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '

    if (!apiKey.startsWith('lk_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Extract prefix (first 20 chars)
    const prefix = apiKey.substring(0, 20);

    // Find API key by prefix
    const key = await this.prisma.apiKey.findFirst({
      where: {
        prefix,
        revokedAt: null,
      },
      include: {
        org: true,
      },
    });

    if (!key) {
      throw new UnauthorizedException('API key not found or revoked');
    }

    // Verify full key hash
    const isValid = await bcrypt.compare(apiKey, key.hashedKey);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Update last used timestamp (async, don't await)
    this.prisma.apiKey
      .update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    // Attach org and apiKey to request
    request.org = key.org;
    request.apiKey = key;

    return true;
  }
}

