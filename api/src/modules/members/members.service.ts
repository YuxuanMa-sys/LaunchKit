import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async listMembers(orgId: string) {
    return this.prisma.membership.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async inviteMember(orgId: string, data: { email: string; role: string }) {
    // TODO: Create invite logic, send email
    return { message: 'Invite sent' };
  }

  async removeMember(memberId: string) {
    return this.prisma.membership.delete({
      where: { id: memberId },
    });
  }
}

