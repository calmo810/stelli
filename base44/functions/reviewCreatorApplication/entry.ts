import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { emailCreatorStatus } from '../../shared/creatorStatus.ts';
import { logAdminAction } from '../../shared/audit.ts';

const DECISIONS = ['approved', 'rejected'];

/**
 * Reviews a pending creator application from Stelli's admin dashboard.
 *
 * The browser never changes creator visibility by itself: only an authenticated
 * admin may approve or reject, and only a still-pending application can move.
 *
 * The decision email goes out once: it is sent here, and the Creator Status
 * Emails workflow (which also fires on the status change) sees it was already
 * sent (see shared/creatorStatus.ts). Every decision is written to the admin
 * activity log, like the hold and money decisions.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Not found.' }, { status: 404 });

    const { lensmanId, decision } = await req.json().catch(() => ({}));
    if (!lensmanId) return Response.json({ error: 'A creator application is required.' }, { status: 400 });
    if (!DECISIONS.includes(decision)) {
      return Response.json({ error: 'Choose approve or reject.' }, { status: 400 });
    }

    const Lensman = base44.asServiceRole.entities.Lensman;
    const lensman = await Lensman.get(lensmanId).catch(() => null);
    if (!lensman) return Response.json({ error: 'Creator application not found.' }, { status: 404 });

    if (lensman.status !== 'pending') {
      if (lensman.status === decision) {
        return Response.json({
          application: { id: lensman.id, display_name: lensman.display_name, status: lensman.status },
          updated: false,
          message: decision === 'approved' ? 'This creator is already live.' : 'This application is already rejected.',
        });
      }
      return Response.json({ error: 'This application was already reviewed.' }, { status: 409 });
    }

    // Only a still-pending application moves, even if two founders press at once.
    await Lensman.updateMany({ id: lensman.id, status: 'pending' }, { $set: { status: decision } });
    const fresh = await Lensman.get(lensman.id).catch(() => null);
    if (!fresh || fresh.status !== decision) {
      return Response.json({ error: 'This application was already reviewed.' }, { status: 409 });
    }

    const sent = await emailCreatorStatus(base44, fresh);
    const name = lensman.display_name || 'This creator';
    const message =
      decision === 'approved'
        ? `${name} is approved and published.${sent.sent ? ' They have been emailed.' : ''}`
        : `${name}'s application was rejected.${sent.sent ? ' They have been emailed.' : ''}`;

    await logAdminAction(base44, user, {
      action: decision === 'approved' ? 'approve_creator' : 'reject_creator',
      summary: message,
      lensmanId: lensman.id,
      details: { emailed: Boolean(sent.sent), previousStatus: lensman.status, via: 'applications' },
    });

    return Response.json({
      application: { id: lensman.id, display_name: lensman.display_name, status: decision },
      updated: true,
      message,
    });
  } catch (error) {
    console.error('reviewCreatorApplication error:', error.message);
    return Response.json({ error: 'The application could not be reviewed. Try again.' }, { status: 500 });
  }
}
