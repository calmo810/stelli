import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const DECISIONS = ['approved', 'rejected'];

/**
 * Reviews a pending creator application from Stelli's admin dashboard.
 *
 * The browser never changes creator visibility by itself: only an authenticated
 * admin may approve or reject, and only a still-pending application can move.
 * Updating Lensman.status triggers the existing Creator Status Emails workflow,
 * which sends the decision email once.
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

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId).catch(() => null);
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

    await base44.asServiceRole.entities.Lensman.update(lensman.id, { status: decision });

    return Response.json({
      application: { id: lensman.id, display_name: lensman.display_name, status: decision },
      updated: true,
      message:
        decision === 'approved'
          ? 'Creator approved and published. Their decision email is being sent.'
          : 'Creator application rejected. Their decision email is being sent.',
    });
  } catch (error) {
    console.error('reviewCreatorApplication error:', error.message);
    return Response.json({ error: 'The application could not be reviewed. Try again.' }, { status: 500 });
  }
}
