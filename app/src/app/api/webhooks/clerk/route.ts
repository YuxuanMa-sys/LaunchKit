import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyClerkWebhook, syncUserToDatabase } from '@/lib/clerk-sync';

export async function POST(req: NextRequest) {
  // Get webhook secret from environment
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Get headers
  const headersList = await headers();
  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
  }

  // Get raw body
  const payload = await req.text();

  try {
    // Verify webhook signature
    const evt = verifyClerkWebhook(
      payload,
      {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      },
      webhookSecret
    );

    // Sync user to database
    await syncUserToDatabase(evt);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}

