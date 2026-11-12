import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { emailCreatorStatus } from '../../shared/creatorStatus.ts';
import { resolveCreatorOwner } from '../../shared/creatorOwner.ts';
import { sendEmail } from '../../shared/notify.ts';
import { SITE_ORIGIN } from '../../shared/origins.ts';
import { logAdminAction } from '../../shared/audit.ts';

const DECISIONS = ['approved', 'rejected', 'needs_changes'];
/** An application a founder can still decide on. */
const OPEN = ['pending', 'needs_changes'];
const MAX_NOTE = 600;

/**
 * Reviews a creator application from Stelli's admin dashboard.
 *
 * The browser never changes creator visibility by itself: only an authenticated
 * admin may decide, and only an application that is still open can move.
 *
 * Three answers:
 *  - approved: the profile goes live;
 *  - rejected: it stays private;
 *  - needs_changes: almost there. The founder writes what to fix, the creator
 *    is emailed that note with a link to their page, and when they send it
 *    back (updateCreatorProfile) it returns to the queue as pending.
 *
 * The approve / reject email goes out once: it is sent here, and the Creator
 * Status Emails workflow (which also fires on the status change) sees it was
 * already sent (see shared/creatorStatus.ts). Every decision is written to the
 * admin activity log, like the hold and money decisions.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Not found.' }, { status: 404 });

    const { lensmanId, decision, note: rawNote } = await req.json().catch(() => ({}));
    if (!lensmanId) return Response.json({ error: 'A creator application is required.' }, { status: 400 });
    if (!DECISIONS.includes(decision)) {
      return Response.json({ error: 'Choose approve, ask for changes, or decline.' }, { status: 400 });
    }

    const note = String(rawNote || '').trim().slice(0, MAX_NOTE);
    if (decision === 'needs_changes' && !note) {
      return Response.json({ error: 'Say what they should change.', field: 'note' }, { status: 400 });
    }

    const Lensman = base44.asServiceRole.entities.Lensman;
    const CreatorContact = base44.asServiceRole.entities.CreatorContact;
    const lensman = await Lensman.get(lensmanId).catch(() => null);
    if (!lensman) return Response.json({ error: 'Creator application not found.' }, { status: 404 });

    // Asking for changes only makes sense on an application waiting on us;
    // approving or declining also works on one that is waiting on the creator.
    const movable = decision === 'needs_changes' ? lensman.status === 'pending' : OPEN.includes(lensman.status);
    if (!movable) {
      if (lensman.status === decision) {
        return Response.json({
          application: { id: lensman.id, display_name: lensman.display_name, status: lensman.status },
          updated: false,
          message:
            decision === 'approved'
              ? 'This creator is already live.'
              : decision === 'rejected'
                ? 'This application is already rejected.'
                : 'This creator has already been asked for changes.',
        });
      }
      return Response.json({ error: 'This application was already reviewed.' }, { status: 409 });
    }

    // Only an application still in the state we read moves, even if two
    // founders press at once.
    await Lensman.updateMany({ id: lensman.id, status: lensman.status }, { $set: { status: decision } });
    const fresh = await Lensman.get(lensman.id).catch(() => null);
    if (!fresh || fresh.status !== decision) {
      return Response.json({ error: 'This application was already reviewed.' }, { status: 409 });
    }

    const contacts = await CreatorContact.filter({ lensman_id: lensman.id });
    const contact = contacts[0] || null;
    const name = lensman.display_name || 'This creator';
    let emailed = false;
    let message = '';

    if (decision === 'needs_changes') {
      if (contact) {
        await CreatorContact.update(contact.id, {
          changes_requested: note,
          changes_requested_at: new Date().toISOString(),
        });
      }
      const { ownerEmail } = await resolveCreatorOwner(base44, fresh);
      const email = ownerEmail || contact?.email || '';
      if (email) {
        await sendEmail(
          base44,
          email,
          'One thing before your Stelli page goes live.',
          `We looked at your application and it's close. Before we can approve it:\n\n${note}\n\nUpdate your page and send it back to us here:\n${SITE_ORIGIN}/edit-profile`
        );
        emailed = true;
      }
      message = `${name} was asked for changes.${emailed ? ' They have been emailed.' : ''}`;
    } else {
      // A decision closes any open request for changes.
      if (contact?.changes_requested) {
        await CreatorContact.update(contact.id, { changes_requested: '' });
      }
      const sent = await emailCreatorStatus(base44, fresh);
      emailed = Boolean(sent.sent);
      message =
        decision === 'approved'
          ? `${name} is approved and published.${emailed ? ' They have been emailed.' : ''}`
          : `${name}'s application was rejected.${emailed ? ' They have been emailed.' : ''}`;
    }

    await logAdminAction(base44, user, {
      action:
        decision === 'approved' ? 'approve_creator' : decision === 'rejected' ? 'reject_creator' : 'request_creator_changes',
      summary: message,
      lensmanId: lensman.id,
      details: { emailed, previousStatus: lensman.status, via: 'applications', ...(note ? { note } : {}) },
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
