/**
 * Sync Clerk user to LaunchKit database
 * Called on user creation/update via Clerk webhooks
 */

import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function syncUserToDatabase(evt: WebhookEvent) {
  const { type, data } = evt;

  switch (type) {
    case 'user.created':
    case 'user.updated': {
      const { id, email_addresses, first_name, last_name } = data;
      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim();

      // TODO: Call LaunchKit API to create/update user
      // await api.users.upsert({ id, email, name });

      console.log(`User ${type}: ${email}`);
      break;
    }

    case 'user.deleted': {
      const { id } = data;
      
      // TODO: Handle user deletion (soft delete or anonymize)
      // await api.users.delete(id);

      console.log(`User deleted: ${id}`);
      break;
    }
  }
}

export function verifyClerkWebhook(
  payload: string,
  headers: Record<string, string>,
  secret: string
): WebhookEvent {
  const wh = new Webhook(secret);
  return wh.verify(payload, headers) as WebhookEvent;
}

