#!/bin/bash

echo "🗄️  Database Check"
echo "================="
echo ""

cd /Users/mayuxuan/Desktop/workspace/LaunchKit/api

echo "📊 Users (with Clerk integration):"
pnpm prisma db execute --stdin << 'EOF'
SELECT id, email, name, "clerkId", "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 5;
EOF

echo ""
echo "🏢 Organizations:"
pnpm prisma db execute --stdin << 'EOF'
SELECT id, name, slug, "planTier", "createdAt" FROM orgs ORDER BY "createdAt" DESC LIMIT 5;
EOF

echo ""
echo "🔑 API Keys:"
pnpm prisma db execute --stdin << 'EOF'
SELECT id, name, prefix, "createdAt", "lastUsedAt", "revokedAt" FROM api_keys ORDER BY "createdAt" DESC LIMIT 5;
EOF

echo ""
echo "📝 Recent Audit Logs:"
pnpm prisma db execute --stdin << 'EOF'
SELECT action, "targetType", "createdAt" FROM audit_logs ORDER BY "createdAt" DESC LIMIT 5;
EOF

echo ""
echo "✅ Database check complete!"

