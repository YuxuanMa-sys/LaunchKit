import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async verifyExternalToken(token: string) {
    try {
      // In production, verify token with Clerk/Auth0
      // For now, decode and validate structure
      const decoded = this.jwtService.decode(token);

      if (!decoded || !decoded['sub']) {
        throw new UnauthorizedException('Invalid token');
      }

      // Find or create user
      const user = await this.prisma.user.findUnique({
        where: { id: decoded['sub'] },
        include: {
          memberships: {
            include: {
              org: true,
            },
          },
        },
      });

      return {
        user,
        organizations: user?.memberships.map((m) => m.org) || [],
      };
    } catch (error) {
      throw new UnauthorizedException('Token verification failed');
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            org: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}

