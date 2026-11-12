import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { emailCreatorStatus } from '../../shared/creatorStatus.ts';
import { logAdminAction, requireAdmin } from '../../shared/audit.ts';

/**
 * A founder's decision about a creator, from the admin page:
 *
 *   approve  the application: the profile goes public, the creator is emailed
 *   reject   the application: the creator is emailed
 *   hold     put an approved creator under review (shadow-ban): they drop out
 *            of browse and can't be sent new requests; current bookings carry on
 *   unhold   lift the hold
 *
 * The admin page used to write Lensman.status straight from the browser. That
 * was already limited to admins by the entity's rules, but it left no record
 * and there was no way to hold a creator at all. Now the decision is made
 * here, checked on the server, and logged.
 *
 * Approving here and changing the status in the Base44 dashboard both work and
 * both email the creator exactly once (see shared/creatorStatus.ts).
 */
const DECISIONS = ['approve', 'reject', 'hold', 'unhold'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await requireAdmin(base44);
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { lensmanId, decision, note } = await req.json();
    if (!lensmanId || !DECISIONS.includes(decision)) {
      return Response.json({ error: 'A creator and a decision are required.' }, { status: 400 });
    }

    const Lensman = base44.asServiceRole.entities.Lensman;
    const lensman = await Lensman.get(lensmanId).catch(() => null);
    if (!lensman) return Response.json({ error: 'Creator not found.' }, { status: 404 });

    const name = lensman.display_name || 'This creator';
    const reason = String(note || '').trim().slice(0, 500);
    let message = '';
    let emailed = false;

    if (decision === 'approve' || decision === 'reject') {
      const status = decision === 'approve' ? 'approved' : 'rejected';
      if (lensman.status !== status) await Lensman.update(lensman.id, { status });
      // Sent here as well as by the workflow; whichever is first sends it.
      const sent = await emailCreatorStatus(base44, { ...lensman, status });
      emailed = Boolean(sent.sent);
      message =
        decision === 'approve'
          ? `${name} is approved and live.${emailed ? ' They have been emailed.' : ''}`
          : `${name}'s application was turned down.${emailed ? ' They have been emailed.' : ''}`;
    } else {
      const underReview = decision === 'hold';
      await Lensman.update(lensman.id, { under_review: underReview });
      const contacts = await base44.asServiceRole.entities.CreatorContact.filter({ lensman_id: lensman.id });
      if (contacts[0] && (reason || !underReview)) {
        await base44.asServiceRole.entities.CreatorContact.update(contacts[0].id, {
          review_note: underReview ? reason : '',
        });
      }
      message = underReview
        ? `${name} is on hold: hidden from browse and closed to new requests. Their current bookings carry on.`
        : `${name} is back in browse and open to requests.`;
    }

    await logAdminAction(base44, user, {
      action: `${decision}_creator`,
      summary: message,
      lensmanId: lensman.id,
      details: { note: reason, emailed, previousStatus: lensman.status, wasUnderReview: Boolean(lensman.under_review) },
    });

    return Response.json({ ok: true, message });
  } catch (error) {
    console.error('reviewCreator error:', error.message);
    return Response.json({ error: 'That did not save. Nothing was changed.' }, { status: 500 });
  }
}
