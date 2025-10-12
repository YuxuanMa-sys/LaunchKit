import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { customAlphabet } from 'nanoid';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        orgId,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(orgId: string, name: string) {
    const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);
    const secret = nanoid();
    
    // Full key: lk_live_pk_abcdef123456_<secret>
    const prefix = `lk_${env}_pk_${secret.substring(0, 10)}`;
    const fullKey = `${prefix}_${secret.substring(10)}`;

    // Hash the full key
    const hashedKey = await bcrypt.hash(fullKey, 10);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        orgId,
        name,
        hashedKey,
        prefix,
      },
    });

    // Return full key only this once
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: fullKey, // Show once!
      prefix,
      createdAt: apiKey.createdAt,
      warning: 'Save this key now. You will not be able to see it again.',
    };
  }

  async revoke(keyId: string) {
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}

