import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
// Use string literals instead of Prisma enums to avoid import issues
type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';
type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';

@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService) {}

  async findUserOrgs(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: {
        org: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return memberships.map((m: any) => ({
      ...m.org,
      role: m.role,
    }));
  }

  async findById(orgId: string) {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            apiKeys: { where: { revokedAt: null } },
            jobs: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async create(userId: string, data: { name: string; slug: string }) {
    // Check slug availability
    const existing = await this.prisma.org.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException('Slug already taken');
    }

    // Create org with owner membership
    const org = await this.prisma.org.create({
      data: {
        name: data.name,
        slug: data.slug,
        planTier: 'FREE',
        memberships: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    return org;
  }

  async update(orgId: string, data: { name?: string }) {
    return this.prisma.org.update({
      where: { id: orgId },
      data,
    });
  }
}

