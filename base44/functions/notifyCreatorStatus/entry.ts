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
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { lensman_id, new_status } = await req.json();

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
    const email = contacts[0]?.email || '';
    if (!email) {
      return Response.json({ error: 'No contact email on file for this creator.' }, { status: 404 });
    }

    const status = new_status || lensman.status;
    const profileUrl = `${PUBLISHED_ORIGIN}/creators/${lensman.slug || lensman.id}`;

    if (status === 'approved') {
      await sendEmail(
        base44,
        email,
        "You're live on Stelli.",
        `Your profile is approved and live. Clients can now find you and send booking requests.\n\n${profileUrl}`
      );
    } else if (status === 'rejected') {
      await sendEmail(
        base44,
        email,
        'About your Stelli application.',
        "Thanks for applying to Stelli. We're not able to approve your profile right now."
      );
    } else {
      // pending and anything else stay silent.
      return Response.json({ sent: false, status });
    }

    console.log(`Status email sent for status "${status}".`);
    return Response.json({ sent: true, status });
  } catch (error) {
    console.error('notifyCreatorStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}