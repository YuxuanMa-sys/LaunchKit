import { PrismaClient, PlanTier, OrgRole, JobType, JobStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (in development only!)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    await prisma.webhookDelivery.deleteMany();
    await prisma.webhookEndpoint.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.job.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.usageMeter.deleteMany();
    await prisma.featureFlag.deleteMany();
    await prisma.invoiceShadow.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.org.deleteMany();
    await prisma.user.deleteMany();
    await prisma.plan.deleteMany();
  }

  // 1. Create Plans
  console.log('📋 Creating plans...');
  const freePlan = await prisma.plan.create({
    data: {
      code: PlanTier.FREE,
      name: 'Free',
      monthlyPriceCents: 0,
      includedTokens: 50000,
      overagePer1kTokensCents: 0, // No overage, hard limit
      maxSeats: 3,
      maxApiKeys: 1,
      features: ['basic_api', 'dashboard'],
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      code: PlanTier.PRO,
      name: 'Pro',
      monthlyPriceCents: 4900,
      includedTokens: 5000000,
      overagePer1kTokensCents: 2, // $0.02 per 1k tokens
      maxSeats: 10,
      maxApiKeys: 5,
      features: ['basic_api', 'dashboard', 'realtime_streaming', 'webhooks', 'priority_support'],
    },
  });

  const enterprisePlan = await prisma.plan.create({
    data: {
      code: PlanTier.ENTERPRISE,
      name: 'Enterprise',
      monthlyPriceCents: 0, // Custom pricing
      includedTokens: 100000000,
      overagePer1kTokensCents: 1,
      maxSeats: null, // Unlimited
      maxApiKeys: null, // Unlimited
      features: [
        'basic_api',
        'dashboard',
        'realtime_streaming',
        'webhooks',
        'priority_support',
        'custom_models',
        'dedicated_support',
        'sla',
      ],
    },
  });

  console.log('✅ Plans created');

  // 2. Create Users
  console.log('👥 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: 'user_seed_alice_123456',
        email: 'alice@example.com',
        name: 'Alice Johnson',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_seed_bob_234567',
        email: 'bob@example.com',
        name: 'Bob Smith',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_seed_charlie_345678',
        email: 'charlie@example.com',
        name: 'Charlie Brown',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_seed_diana_456789',
        email: 'diana@example.com',
        name: 'Diana Prince',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // 3. Create Organizations
  console.log('🏢 Creating organizations...');
  const freeOrg = await prisma.org.create({
    data: {
      name: 'Acme Startup',
      slug: 'acme-startup',
      planTier: PlanTier.FREE,
    },
  });

  const proOrg = await prisma.org.create({
    data: {
      name: 'TechCorp Inc',
      slug: 'techcorp',
      planTier: PlanTier.PRO,
      billingCustomerId: 'cus_demo_techcorp',
      subscriptionId: 'sub_demo_techcorp',
      subscriptionStatus: 'active',
    },
  });

  console.log('✅ Organizations created');

  // 4. Create Memberships
  console.log('🤝 Creating memberships...');
  await prisma.membership.createMany({
    data: [
      // Acme Startup (FREE) - Alice as owner, Bob as member
      { userId: users[0].id, orgId: freeOrg.id, role: OrgRole.OWNER },
      { userId: users[1].id, orgId: freeOrg.id, role: OrgRole.MEMBER },
      { userId: users[2].id, orgId: freeOrg.id, role: OrgRole.MEMBER },
      // TechCorp (PRO) - Diana as owner, Charlie as admin
      { userId: users[3].id, orgId: proOrg.id, role: OrgRole.OWNER },
      { userId: users[2].id, orgId: proOrg.id, role: OrgRole.ADMIN },
    ],
  });

  console.log('✅ Memberships created');

  // 5. Create API Keys
  console.log('🔑 Creating API keys...');
  const apiKey1 = await bcrypt.hash('test_key_acme_abc123xyz', 10);
  const apiKey2 = await bcrypt.hash('test_key_techcorp_def456uvw', 10);
  const apiKey3 = await bcrypt.hash('test_key_techcorp_revoked', 10);

  await prisma.apiKey.createMany({
    data: [
      {
        orgId: freeOrg.id,
        name: 'Production Key',
        hashedKey: apiKey1,
        prefix: 'lk_test_pk_acme_abc',
        lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        orgId: proOrg.id,
        name: 'Production Key',
        hashedKey: apiKey2,
        prefix: 'lk_live_pk_tech_def',
        lastUsedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        orgId: proOrg.id,
        name: 'Old Key (Revoked)',
        hashedKey: apiKey3,
        prefix: 'lk_live_pk_tech_old',
        revokedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    ],
  });

  console.log('✅ API keys created');

  // 6. Create Jobs (synthetic historical data)
  console.log('📊 Creating job history...');
  const jobPromises = [];
  const now = Date.now();

  // Create 100 jobs over the last 30 days
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const tokens = Math.floor(Math.random() * 5000) + 100;
    const isSuccess = Math.random() > 0.1; // 90% success rate

    jobPromises.push(
      prisma.job.create({
        data: {
          orgId: Math.random() > 0.5 ? proOrg.id : freeOrg.id,
          type: [JobType.SUMMARIZE, JobType.EMBED, JobType.TRANSLATE][
            Math.floor(Math.random() * 3)
          ],
          status: isSuccess ? JobStatus.SUCCEEDED : JobStatus.FAILED,
          input: { text: 'Sample input text...', model: 'gpt-4' },
          ...(isSuccess && { output: { result: 'Sample output...' } }),
          tokenUsed: tokens,
          costCents: Math.floor((tokens / 1000) * 2), // $0.02 per 1k tokens
          ...(isSuccess ? {} : { error: 'Rate limit exceeded' }),
          createdAt,
          ...(isSuccess && { startedAt: new Date(createdAt.getTime() + 1000) }),
          ...(isSuccess && { completedAt: new Date(createdAt.getTime() + 5000) }),
        },
      })
    );
  }

  await Promise.all(jobPromises);
  console.log('✅ Job history created');

  // 7. Create Usage Meters
  console.log('📈 Creating usage meters...');
  const usagePromises = [];

  // Create hourly usage meters for the last 7 days
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const windowStart = new Date(now - day * 24 * 60 * 60 * 1000 - hour * 60 * 60 * 1000);
      const windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000);
      const tokens = Math.floor(Math.random() * 10000);
      const jobs = Math.floor(Math.random() * 50);

      usagePromises.push(
        prisma.usageMeter.create({
          data: {
            orgId: proOrg.id,
            windowStart,
            windowEnd,
            tokens,
            jobs,
            costCents: Math.floor((tokens / 1000) * 2),
          },
        })
      );
    }
  }

  await Promise.all(usagePromises);
  console.log('✅ Usage meters created');

  // 8. Create Webhook Endpoint
  console.log('🪝 Creating webhook endpoints...');
  const webhook = await prisma.webhookEndpoint.create({
    data: {
      orgId: proOrg.id,
      url: 'https://api.example.com/webhooks/launchkit',
      secret: 'whsec_test_' + Math.random().toString(36).substring(7),
      enabled: true,
      lastDeliveryAt: new Date(now - 10 * 60 * 1000),
    },
  });

  // Create a failed webhook delivery for testing retry UI
  await prisma.webhookDelivery.create({
    data: {
      webhookEndpointId: webhook.id,
      eventType: 'job.succeeded',
      payload: { jobId: 'job_123', status: 'succeeded' },
      signature: 't=1234567890,v1=abcdef123456',
      status: 'FAILED',
      attempt: 3,
      maxAttempts: 5,
      nextAttemptAt: new Date(now + 5 * 60 * 1000), // Retry in 5 minutes
      lastAttemptAt: new Date(now - 2 * 60 * 1000),
      responseStatus: 500,
      error: 'Connection timeout',
    },
  });

  console.log('✅ Webhook endpoints created');

  // 9. Create Audit Logs
  console.log('📝 Creating audit logs...');
  const apiKeys = await prisma.apiKey.findMany();

  await prisma.auditLog.createMany({
    data: [
      {
        orgId: freeOrg.id,
        actorUserId: users[0].id,
        action: 'apikey.created',
        targetType: 'ApiKey',
        targetId: apiKeys[0].id,
        metadata: { keyName: 'Production Key' },
        ip: '192.168.1.1',
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      },
      {
        orgId: proOrg.id,
        actorUserId: users[3].id,
        action: 'member.invited',
        targetType: 'User',
        targetId: users[2].id,
        metadata: { email: users[2].email, role: 'ADMIN' },
        ip: '192.168.1.2',
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
      },
      {
        orgId: proOrg.id,
        actorUserId: users[3].id,
        action: 'apikey.revoked',
        targetType: 'ApiKey',
        targetId: apiKeys[2].id,
        metadata: { reason: 'Key rotation' },
        ip: '192.168.1.2',
        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Audit logs created');

  // 10. Create Feature Flags
  console.log('🚩 Creating feature flags...');
  await prisma.featureFlag.createMany({
    data: [
      {
        key: 'realtime_streaming',
        enabled: true,
        planGate: PlanTier.PRO,
      },
      {
        key: 'advanced_analytics',
        enabled: true,
        planGate: PlanTier.ENTERPRISE,
      },
      {
        key: 'webhooks',
        enabled: true,
        planGate: PlanTier.PRO,
      },
      {
        orgId: proOrg.id,
        key: 'beta_features',
        enabled: true,
        planGate: null,
      },
    ],
  });

  console.log('✅ Feature flags created');

  console.log('\n✨ Seeding complete!\n');
  console.log('📊 Summary:');
  console.log(`   - ${await prisma.user.count()} users`);
  console.log(`   - ${await prisma.org.count()} organizations`);
  console.log(`   - ${await prisma.apiKey.count()} API keys`);
  console.log(`   - ${await prisma.job.count()} jobs`);
  console.log(`   - ${await prisma.usageMeter.count()} usage records`);
  console.log(`   - ${await prisma.auditLog.count()} audit logs`);
  console.log('\n🔑 Test credentials:');
  console.log(`   Email: alice@example.com (Owner of Acme Startup - FREE)`);
  console.log(`   Email: diana@example.com (Owner of TechCorp - PRO)`);
  console.log('\n🔐 Test API Keys:');
  console.log(`   Acme: lk_test_pk_acme_abc (FREE plan)`);
  console.log(`   TechCorp: lk_live_pk_tech_def (PRO plan)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

