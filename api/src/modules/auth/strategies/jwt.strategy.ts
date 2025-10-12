import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const publishableKey = configService.get<string>('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    // Extract the domain from the publishable key (format: pk_test_BASE64DOMAIN)
    // The publishable key format is: pk_{env}_{base64_encoded_domain}
    const keyParts = publishableKey?.split('_') || [];
    const base64Domain = keyParts.slice(2).join('_'); // Everything after pk_test_
    const clerkDomain = Buffer.from(base64Domain, 'base64').toString('utf8').replace(/\$/, '');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use Clerk's JWKS endpoint to get the public key for verification
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${clerkDomain}/.well-known/jwks.json`,
      }),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    try {
      // Payload from Clerk JWT contains: sub (user ID), email, etc.
      const clerkUserId = payload.sub;

      if (!clerkUserId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Get or create user in our database
      let user = await this.prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        include: {
          memberships: {
            include: {
              org: true,
            },
          },
        },
      });

      // If user doesn't exist, create them with a default organization
      if (!user) {
        try {
          // Fetch user details from Clerk
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const email =
            clerkUser.emailAddresses.find(
              (e) => e.id === clerkUser.primaryEmailAddressId,
            )?.emailAddress || '';
          const name =
            `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
            email;

          // Create user and default organization in a transaction
          user = await this.prisma.$transaction(async (tx: any) => {
            // Create organization
            const org = await tx.org.create({
              data: {
                name: `${name}'s Organization`,
                slug: `org-${clerkUserId.substring(0, 8)}`,
                planTier: 'FREE',
              },
            });

            // Create user
            const newUser = await tx.user.create({
              data: {
                clerkId: clerkUserId,
                email,
                name,
              },
            });

            // Create membership
            await tx.membership.create({
              data: {
                userId: newUser.id,
                orgId: org.id,
                role: 'OWNER',
              },
            });

            // Fetch user with relations
            return tx.user.findUnique({
              where: { id: newUser.id },
              include: {
                memberships: {
                  include: {
                    org: true,
                  },
                },
              },
            });
          });
        } catch (error) {
          // If creation fails (e.g., due to race condition), try to fetch the user again
          console.error('Failed to create user, attempting to fetch:', error);
          user = await this.prisma.user.findUnique({
            where: { clerkId: clerkUserId },
            include: {
              memberships: {
                include: {
                  org: true,
                },
              },
            },
          });
          
          if (!user) {
            throw new UnauthorizedException('Failed to create or fetch user');
          }
        }
      }

      // Return user info for request context
      return {
        userId: user!.id,
        clerkId: clerkUserId,
        email: user!.email,
        name: user!.name,
        orgs: user!.memberships.map((m: any) => ({
          id: m.org.id,
          name: m.org.name,
          planTier: m.org.planTier,
          role: m.role,
        })),
      };
    } catch (error) {
      console.error('JWT validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
