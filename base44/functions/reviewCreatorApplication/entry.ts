import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendEmail } from '../../shared/notify.ts';

const PUBLISHED_ORIGIN = 'https://getstelli.base44.app';

/**
 * Founder decision on a creator application. Approving makes the profile live;
 * either way the creator gets an email and the note is kept for the record.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Not allowed.' }, { status: 403 });

    const { lensmanId, action, note } = await req.json();
    if (!lensmanId || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Pick approve or reject.' }, { status: 400 });
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId);
    if (!lensman) return Response.json({ error: 'Application not found.' }, { status: 404 });

    const approved = action === 'approve';
    const updated = await base44.asServiceRole.entities.Lensman.update(lensmanId, {
      status: approved ? 'approved' : 'rejected',
      review_note: (note || '').trim(),
    });

    const to = lensman.email || '';
    if (approved) {
      await sendEmail(
        base44,
        to,
        "You're live on Stelli.",
        `Your profile is approved and live on Stelli: ${PUBLISHED_ORIGIN}/creators/${lensmanId}`
      );
    } else {
      await sendEmail(
        base44,
        to,
        'About your Stelli application',
        'Thanks for applying to Stelli. We are not adding your profile to the collective right now, so it will stay offline. We appreciate you showing us your work.'
      );
    }

    return Response.json({ lensman: updated });
  } catch (error) {
    console.error('reviewCreatorApplication error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}