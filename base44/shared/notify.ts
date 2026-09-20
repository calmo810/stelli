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