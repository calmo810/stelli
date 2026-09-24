import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendEmail } from '../../shared/notify.ts';

/**
 * Confirms a password change by email, to the address they log in with.
 * The change itself is handled by the platform's auth service.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    await sendEmail(
      base44,
      user.email,
      'Your Stelli password was changed.',
      "Your password was just changed. If this wasn't you, reset it right away."
    );

    return Response.json({ sent: true });
  } catch (error) {
    console.error('notifyPasswordChanged error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}