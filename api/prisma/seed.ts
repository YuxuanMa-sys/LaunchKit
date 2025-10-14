import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const users = [
    {
      id: 'user_2abc123def456',
      email: 'demo@launchkit.com',
      name: 'Demo User',
      clerkId: 'user_2abc123def456',
    },
    {
      id: 'user_2xyz789ghi012',
      email: 'enterprise@launchkit.com',
      name: 'Enterprise User',
      clerkId: 'user_2xyz789ghi012',
    },
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { clerkId: userData.clerkId },
      update: {},
      create: userData,
    });
  }

  console.log('✅ Created sample users');

  // Create sample organizations
  const organizations = [
    {
      id: 'org_demo_startup',
      name: 'Demo Startup',
      slug: 'demo-startup',
      planTier: 'FREE' as const,
    },
    {
      id: 'org_enterprise_corp',
      name: 'Enterprise Corp',
      slug: 'enterprise-corp',
      planTier: 'ENTERPRISE' as const,
    },
  ];

  for (const orgData of organizations) {
    await prisma.org.upsert({
      where: { id: orgData.id },
      update: {},
      create: orgData,
    });
  }

  console.log('✅ Created sample organizations');

  // Create sample API keys with correct format: lk_test_pk_<8chars>_<32chars>
  const demoKey1 = 'lk_test_pk_demo1234_abcdef1234567890abcdef1234567890';
  const demoKey2 = 'lk_test_pk_demo5678_1234567890abcdef1234567890abcdef';
  const enterpriseKey = 'lk_test_pk_entr9012_9876543210fedcba9876543210fedcba';
  
  const apiKeys = [
    {
      id: 'key_demo_primary',
      name: 'Primary API Key',
      hashedKey: await hash(demoKey1, 12),
      prefix: 'lk_test_pk_demo1234',
      orgId: 'org_demo_startup',
      revokedAt: null, // null means active
    },
    {
      id: 'key_demo_secondary',
      name: 'Secondary API Key',
      hashedKey: await hash(demoKey2, 12),
      prefix: 'lk_test_pk_demo5678',
      orgId: 'org_demo_startup',
      revokedAt: null, // null means active
    },
    {
      id: 'key_enterprise_primary',
      name: 'Enterprise Primary Key',
      hashedKey: await hash(enterpriseKey, 12),
      prefix: 'lk_test_pk_entr9012',
      orgId: 'org_enterprise_corp',
      revokedAt: null, // null means active
    },
  ];

  for (const keyData of apiKeys) {
    await prisma.apiKey.upsert({
      where: { id: keyData.id },
      update: {},
      create: keyData,
    });
  }

  console.log('✅ Created sample API keys');

  // Create sample jobs
  const jobs = [
    {
      id: 'job_demo_summarize_1',
      type: 'SUMMARIZE' as const,
      status: 'SUCCEEDED' as const,
      input: {
        text: 'This is a sample text for summarization. It contains multiple sentences and paragraphs that demonstrate the summarization capabilities of our AI system.',
      },
      output: {
        summary: 'Sample text demonstrates AI summarization capabilities with multiple sentences and paragraphs.',
      },
      orgId: 'org_demo_startup',
      tokenUsed: 150,
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 2500),
    },
    {
      id: 'job_demo_classify_1',
      type: 'CLASSIFY' as const,
      status: 'SUCCEEDED' as const,
      input: {
        text: 'I love this product! It works perfectly and exceeded my expectations.',
      },
      output: {
        classification: 'positive',
        confidence: 0.95,
      },
      orgId: 'org_demo_startup',
      tokenUsed: 75,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 1200),
    },
    {
      id: 'job_demo_sentiment_1',
      type: 'SENTIMENT' as const,
      status: 'SUCCEEDED' as const,
      input: {
        text: 'The service was okay, nothing special but it gets the job done.',
      },
      output: {
        sentiment: 'neutral',
        score: 0.1,
      },
      orgId: 'org_demo_startup',
      tokenUsed: 60,
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000 + 800),
    },
    {
      id: 'job_enterprise_extract_1',
      type: 'EXTRACT' as const,
      status: 'SUCCEEDED' as const,
      input: {
        text: 'Contact us at support@company.com or call 555-123-4567 for assistance.',
      },
      output: {
        entities: [
          { type: 'email', value: 'support@company.com' },
          { type: 'phone', value: '555-123-4567' },
        ],
      },
      orgId: 'org_enterprise_corp',
      tokenUsed: 90,
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 1500),
    },
    {
      id: 'job_demo_failed_1',
      type: 'SUMMARIZE' as const,
      status: 'FAILED' as const,
      input: {
        text: 'This job will fail for demonstration purposes.',
      },
      output: Prisma.DbNull,
      error: 'Simulated failure for demo purposes',
      orgId: 'org_demo_startup',
      tokenUsed: 0,
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      completedAt: new Date(Date.now() - 30 * 60 * 1000 + 100),
    },
  ];

  for (const jobData of jobs) {
    await prisma.job.upsert({
      where: { id: jobData.id },
      update: {},
      create: jobData,
    });
  }

  console.log('✅ Created sample jobs');

  // Create sample usage data
  const usageData = [
    {
      orgId: 'org_demo_startup',
      jobs: 25,
      tokens: 1500,
      windowStart: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      windowEnd: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      orgId: 'org_demo_startup',
      jobs: 15,
      tokens: 900,
      windowStart: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      windowEnd: new Date(Date.now()), // now
    },
    {
      orgId: 'org_enterprise_corp',
      jobs: 100,
      tokens: 15000,
      windowStart: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      windowEnd: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
  ];

  for (const usage of usageData) {
    await prisma.usageMeter.upsert({
      where: {
        orgId_windowStart_windowEnd: {
          orgId: usage.orgId,
          windowStart: usage.windowStart,
          windowEnd: usage.windowEnd,
        },
      },
      update: {},
      create: usage,
    });
  }

  console.log('✅ Created sample usage data');

  // Create sample webhook endpoints
  const webhookEndpoints = [
    {
      id: 'webhook_demo_primary',
      url: 'https://webhook.site/unique-id-123',
      orgId: 'org_demo_startup',
      enabled: true,
      secret: 'webhook_secret_demo_123',
    },
    {
      id: 'webhook_enterprise_primary',
      url: 'https://api.enterprise.com/webhooks/launchkit',
      orgId: 'org_enterprise_corp',
      enabled: true,
      secret: 'webhook_secret_enterprise_456',
    },
  ];

  for (const webhookData of webhookEndpoints) {
    await prisma.webhookEndpoint.upsert({
      where: { id: webhookData.id },
      update: {},
      create: webhookData,
    });
  }

  console.log('✅ Created sample webhook endpoints');

  // Create sample webhook deliveries
  const webhookDeliveries = [
    {
      id: 'delivery_demo_1',
      webhookEndpointId: 'webhook_demo_primary',
      eventType: 'job.completed',
      payload: {
        jobId: 'job_demo_summarize_1',
        type: 'SUMMARIZE',
        status: 'SUCCEEDED',
        orgId: 'org_demo_startup',
      },
      signature: 'sha256=demo_signature_123',
      status: 'SUCCESS' as const,
      responseStatus: 200,
      responseBody: 'OK',
      attempt: 1,
      lastAttemptAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: 'delivery_demo_2',
      webhookEndpointId: 'webhook_demo_primary',
      eventType: 'job.failed',
      payload: {
        jobId: 'job_demo_failed_1',
        type: 'SUMMARIZE',
        status: 'FAILED',
        error: 'Simulated failure for demo purposes',
        orgId: 'org_demo_startup',
      },
      signature: 'sha256=demo_signature_456',
      status: 'FAILED' as const,
      responseStatus: 500,
      responseBody: 'Internal Server Error',
      attempt: 3,
      lastAttemptAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: 'delivery_enterprise_1',
      webhookEndpointId: 'webhook_enterprise_primary',
      eventType: 'job.completed',
      payload: {
        jobId: 'job_enterprise_extract_1',
        type: 'EXTRACT',
        status: 'SUCCEEDED',
        orgId: 'org_enterprise_corp',
      },
      signature: 'sha256=enterprise_signature_789',
      status: 'SUCCESS' as const,
      responseStatus: 200,
      responseBody: '{"received": true}',
      attempt: 1,
      lastAttemptAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ];

  for (const deliveryData of webhookDeliveries) {
    await prisma.webhookDelivery.upsert({
      where: { id: deliveryData.id },
      update: {},
      create: deliveryData,
    });
  }

  console.log('✅ Created sample webhook deliveries');

  // Update organizations with billing data
  await prisma.org.update({
    where: { id: 'org_demo_startup' },
    data: {
      billingCustomerId: 'cus_demo_startup_123',
      subscriptionId: null,
      subscriptionStatus: 'active',
    },
  });

  await prisma.org.update({
    where: { id: 'org_enterprise_corp' },
    data: {
      billingCustomerId: 'cus_enterprise_corp_456',
      subscriptionId: 'sub_enterprise_monthly_789',
      subscriptionStatus: 'active',
    },
  });

  console.log('✅ Updated organizations with billing data');

  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('📋 Sample Data Created:');
  console.log('  • 2 Users (Demo User, Enterprise User)');
  console.log('  • 2 Organizations (Demo Startup, Enterprise Corp)');
  console.log('  • 3 API Keys (with prefixes: lk_demo_1234, lk_demo_abcd, lk_enterprise_xyz7)');
  console.log('  • 5 Jobs (various types and statuses)');
  console.log('  • Usage metrics (jobs and tokens)');
  console.log('  • 2 Webhook endpoints');
  console.log('  • 3 Webhook deliveries (success and failure examples)');
  console.log('  • Billing records for both organizations');
  console.log('');
  console.log('🔑 Demo API Keys:');
  console.log('  • ' + demoKey1 + ' (Demo Startup)');
  console.log('  • ' + demoKey2 + ' (Demo Startup)');
  console.log('  • ' + enterpriseKey + ' (Enterprise Corp)');
  console.log('');
  console.log('🌐 Demo Webhook URLs:');
  console.log('  • https://webhook.site/unique-id-123 (Demo Startup)');
  console.log('  • https://api.enterprise.com/webhooks/launchkit (Enterprise Corp)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });