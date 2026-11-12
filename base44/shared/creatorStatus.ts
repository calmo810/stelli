import { sendEmail } from './notify.ts';
import { resolveCreatorOwner } from './creatorOwner.ts';
import { SITE_ORIGIN } from './origins.ts';

/**
 * Tells a creator their application was approved or turned down.
 *
 * Used by both doors: the "Creator Status Emails" workflow (which fires when a
 * founder changes the status in the Base44 dashboard) and the admin page's
 * approve / reject action. Each decision is emailed once — the second caller
 * finds `status_notified` already set and sends nothing — so approving from
 * the admin page never sends two emails.
 *
 * The email goes to the address the creator signs in with. A contact address
 * typed on the profile is only the fallback: it may not be a mailbox Stelli
 * can reach.
 */
export async function emailCreatorStatus(base44, lensman) {
  if (!lensman) return { sent: false, reason: 'not-found' };

  // Read from the record, never from the caller: nobody chooses which template fires.
  const status = lensman.status;
  if (status !== 'approved' && status !== 'rejected') return { sent: false, status };

  const contacts = await base44.asServiceRole.entities.CreatorContact.filter({ lensman_id: lensman.id });
  const contact = contacts[0] || null;
  if (contact?.status_notified === status) return { sent: false, status, reason: 'already-notified' };

  const { ownerEmail } = await resolveCreatorOwner(base44, lensman);
  const email = ownerEmail || contact?.email || '';
  if (!email) return { sent: false, status, reason: 'no-email' };

  if (status === 'approved') {
    await sendEmail(
      base44,
      email,
      "You're live on Stelli.",
      `Your profile is approved and live. Clients can now find you and send booking requests.\n\n${SITE_ORIGIN}/creators/${lensman.slug || lensman.id}`
    );
  } else {
    await sendEmail(
      base44,
      email,
      'About your Stelli application.',
      "Thanks for applying to Stelli. We're not able to approve your profile right now."
    );
  }

  if (contact) {
    await base44.asServiceRole.entities.CreatorContact.update(contact.id, { status_notified: status });
  }
  return { sent: true, status };
}
