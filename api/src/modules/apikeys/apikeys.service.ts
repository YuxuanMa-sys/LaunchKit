import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-apikey.dto';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all API keys for organizations the user has access to
   */
  async listKeys(userId: string) {
    // Get user's organizations
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { org: true },
    });

    const orgIds = memberships.map((m: any) => m.orgId);

    // Get API keys for those orgs
    const keys = await this.prisma.apiKey.findMany({
      where: {
        orgId: { in: orgIds },
        revokedAt: null, // Only active keys
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            planTier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return without the hashed key
    return keys.map((key: any) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      org: key.org,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
    }));
  }

  /**
   * Create a new API key
   */
  async createKey(userId: string, dto: CreateApiKeyDto) {
    // Verify user has access to the org
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        orgId: dto.orgId,
      },
      include: { org: true },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Check if org has reached key limit based on plan
    const existingKeys = await this.prisma.apiKey.count({
      where: {
        orgId: dto.orgId,
        revokedAt: null,
      },
    });

    const keyLimits: Record<string, number> = {
      FREE: 2,
      PRO: 10,
      ENTERPRISE: 50,
    };

    const planTier = membership.org.planTier as string;
    if (existingKeys >= keyLimits[planTier]) {
      throw new BadRequestException(
        `Your ${planTier} plan allows maximum ${keyLimits[planTier]} API keys`,
      );
    }

    // Generate the API key
    // Format: lk_<env>_<prefix>_<random>
    // Example: lk_live_pk_1a2b3c4d5e6f7g8h
    const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const prefix = `lk_${env}_pk_${nanoid(8)}`;
    const secret = nanoid(32); // 32-character secret
    const fullKey = `${prefix}_${secret}`;

    // Hash the full key for storage
    const hashedKey = await bcrypt.hash(fullKey, 12);

    // Create the API key
    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
        prefix,
        hashedKey,
        orgId: dto.orgId,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            planTier: true,
          },
        },
      },
    });

    // Return the key with the plain text version (ONLY SHOWN ONCE!)
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: fullKey, // ⚠️ This is the ONLY time the full key is returned
      prefix: apiKey.prefix,
      org: apiKey.org,
      createdAt: apiKey.createdAt,
      warning: 'Save this key securely - it will not be shown again!',
    };
  }

  /**
   * Revoke an API key
   */
  async revokeKey(userId: string, keyId: string) {
    // Get the key
    const key = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    // Verify user has access to the org
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        orgId: key.orgId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this API key');
    }

    // Soft delete by setting revokedAt
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    // Log the revocation
    await this.prisma.auditLog.create({
      data: {
        orgId: key.orgId,
        actorUserId: userId,
        action: 'api_key.revoked',
        targetType: 'ApiKey',
        targetId: keyId,
        metadata: {
          keyName: key.name,
          keyPrefix: key.prefix,
        },
      },
    });
  }

  /**
   * Verify an API key (used by ApiKeyGuard)
   */
  async verifyKey(apiKey: string): Promise<{ orgId: string; keyId: string }> {
    // Extract prefix from the key
    // Format: lk_test_pk_abc123_secret456
    const parts = apiKey.split('_');
    if (parts.length < 4) {
      throw new ForbiddenException('Invalid API key format');
    }

    const prefix = parts.slice(0, 4).join('_'); // lk_test_pk_abc123

    // Find key by prefix
    const key = await this.prisma.apiKey.findFirst({
      where: {
        prefix,
        revokedAt: null,
      },
    });

    if (!key) {
      throw new ForbiddenException('Invalid or revoked API key');
    }

    // Verify the hash
    const isValid = await bcrypt.compare(apiKey, key.hashedKey);
    if (!isValid) {
      throw new ForbiddenException('Invalid API key');
    }

    // Update last used timestamp
    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      orgId: key.orgId,
      keyId: key.id,
    };
  }
}
