import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendEmail } from '../../shared/notify.ts';

const PUBLISHED_ORIGIN = 'https://getstelli.base44.app';

/**
 * Emails a creator when a founder changes their status in the Base44 dashboard.
 * Called by the "Creator Status Emails" workflow on the Lensman entity.
 * Only `status` is read — `under_review` is reserved for flagging and never touched.
 *
 * Contact details live in CreatorContact, so this reads that record for the
 * address to write to.
 *
 * The workflow calls this server-side with no user, and an anonymous caller
 * looks the same from in here, so the endpoint is built not to need the
 * caller's word for anything: the status comes from the record, and each
 * status is emailed once. Replaying the call sends nothing.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // A signed-in user must be a founder.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { lensman_id } = await req.json();

    if (!lensman_id) {
      return Response.json({ error: 'lensman_id is required.' }, { status: 400 });
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensman_id);
    if (!lensman) {
      return Response.json({ error: 'Creator not found.' }, { status: 404 });
    }

    const contacts = await base44.asServiceRole.entities.CreatorContact.filter({
      lensman_id: lensman.id,
    });
    const contact = contacts[0];
    const email = contact?.email || '';
    if (!email) {
      return Response.json({ error: 'No contact email on file for this creator.' }, { status: 404 });
    }

    // Read from the record, never from the caller: nobody gets to choose which
    // template fires.
    const status = lensman.status;

    if (status !== 'approved' && status !== 'rejected') {
      // pending and anything else stay silent.
      return Response.json({ sent: false, status });
    }

    // One email per decision. A repeat call for a status already announced is a
    // no-op, so nobody can make a creator think they were approved or turned
    // down a second time.
    if (contact.status_notified === status) {
      return Response.json({ sent: false, status, reason: 'Already notified.' });
    }

    const profileUrl = `${PUBLISHED_ORIGIN}/creators/${lensman.slug || lensman.id}`;

    if (status === 'approved') {
      await sendEmail(
        base44,
        email,
        "You're live on Stelli.",
        `Your profile is approved and live. Clients can now find you and send booking requests.\n\n${profileUrl}`
      );
    } else {
      await sendEmail(
        base44,
        email,
        'About your Stelli application.',
        "Thanks for applying to Stelli. We're not able to approve your profile right now."
      );
    }

    await base44.asServiceRole.entities.CreatorContact.update(contact.id, {
      status_notified: status,
    });

    console.log(`Status email sent for status "${status}".`);
    return Response.json({ sent: true, status });
  } catch (error) {
    console.error('notifyCreatorStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}