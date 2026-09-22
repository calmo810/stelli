/**
 * Shared email helper for the booking pipeline.
 * Sends never throw — a failed notification must not fail the action.
 */
export async function sendEmail(base44, to, subject, body) {
  if (!to) return;
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body });
  } catch (error) {
    console.error('Email failed for', to, '-', error.message);
  }
}

export async function notifyBoth(base44, emails, subject, body) {
  const recipients = [...new Set((emails || []).filter(Boolean))];
  await Promise.all(recipients.map((to) => sendEmail(base44, to, subject, body)));
}

const BATCH_MS = 15 * 60 * 1000;

/**
 * Thread notifications, batched per person: nobody gets more than one email
 * every 15 minutes about the same booking, and someone who already opened the
 * thread is not emailed at all.
 */
export async function notifyThread(base44, booking, { to, role, subject, body, sinceIso }) {
  if (!to) return { sent: false, reason: 'no-recipient' };

  const readAt = role === 'client' ? booking.client_last_read_at : booking.creator_last_read_at;
  if (readAt && sinceIso && new Date(readAt).getTime() >= new Date(sinceIso).getTime()) {
    return { sent: false, reason: 'already-read' };
  }

  const stamp = role === 'client' ? booking.client_notified_at : booking.creator_notified_at;
  const last = stamp ? new Date(stamp).getTime() : 0;
  if (Date.now() - last < BATCH_MS) return { sent: false, reason: 'batched' };

  await sendEmail(base44, to, subject, body);

  try {
    await base44.asServiceRole.entities.Booking.update(booking.id, {
      [role === 'client' ? 'client_notified_at' : 'creator_notified_at']: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Notification stamp failed for booking', booking.id, '-', error.message);
  }

  return { sent: true };
}