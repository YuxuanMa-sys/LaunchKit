const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();

async function createDemoApiKeys() {
  console.log('🔑 Creating demo API keys...');

  // Create API key for demo startup
  const env = 'test'; // development environment
  const prefix1 = `lk_${env}_pk_${nanoid(8)}`;
  const secret1 = nanoid(32);
  const fullKey1 = `${prefix1}_${secret1}`;
  const hashedKey1 = await bcrypt.hash(fullKey1, 12);

  const apiKey1 = await prisma.apiKey.create({
    data: {
      name: 'Demo API Key',
      prefix: prefix1,
      hashedKey: hashedKey1,
      orgId: 'org_demo_startup',
    },
  });

  console.log('✅ Created demo API key:', fullKey1);

  // Create API key for enterprise
  const prefix2 = `lk_${env}_pk_${nanoid(8)}`;
  const secret2 = nanoid(32);
  const fullKey2 = `${prefix2}_${secret2}`;
  const hashedKey2 = await bcrypt.hash(fullKey2, 12);

  const apiKey2 = await prisma.apiKey.create({
    data: {
      name: 'Enterprise API Key',
      prefix: prefix2,
      hashedKey: hashedKey2,
      orgId: 'org_enterprise_corp',
    },
  });

  console.log('✅ Created enterprise API key:', fullKey2);

  // Test the API keys
  console.log('\n🧪 Testing API key validation...');
  
  // Test demo key
  const testKey1 = await prisma.apiKey.findFirst({
    where: { prefix: prefix1, revokedAt: null },
  });
  
  if (testKey1) {
    const isValid1 = await bcrypt.compare(fullKey1, testKey1.hashedKey);
    console.log('Demo key validation:', isValid1 ? '✅ Valid' : '❌ Invalid');
  }

  // Test enterprise key
  const testKey2 = await prisma.apiKey.findFirst({
    where: { prefix: prefix2, revokedAt: null },
  });
  
  if (testKey2) {
    const isValid2 = await bcrypt.compare(fullKey2, testKey2.hashedKey);
    console.log('Enterprise key validation:', isValid2 ? '✅ Valid' : '❌ Invalid');
  }

  console.log('\n📋 Demo API Keys Created:');
  console.log(`Demo Startup: ${fullKey1}`);
  console.log(`Enterprise Corp: ${fullKey2}`);

  // Write keys to a file for the demo script to use
  const fs = require('fs');
  fs.writeFileSync('demo-keys.json', JSON.stringify({
    demo: fullKey1,
    enterprise: fullKey2
  }, null, 2));

  console.log('\n💾 Keys saved to demo-keys.json');
}

createDemoApiKeys()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
