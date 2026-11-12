import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { emailCreatorStatus } from '../../shared/creatorStatus.ts';
import { requireAdmin } from '../../shared/audit.ts';

/**
 * Emails a creator when a founder changes their status in the Base44 dashboard.
 * Called by the "Creator Status Emails" workflow on the Lensman entity.
 * Only `status` is read — `under_review` is reserved for flagging and never touched.
 *
 * The workflow calls this as an app admin, and so must anyone invoking it by
 * hand: without that check an anonymous caller could read a creator's vetting
 * state straight off the response, and probe which profiles exist. The status
 * itself always comes from the record, never from the caller, and each status
 * is emailed once — replaying the call sends nothing. The admin page's own
 * approve / reject action (reviewCreator) shares the same sender, so whichever
 * door a founder uses, the creator gets exactly one email.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await requireAdmin(base44);
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { lensman_id } = await req.json();
    if (!lensman_id) {
      return Response.json({ error: 'lensman_id is required.' }, { status: 400 });
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensman_id).catch(() => null);
    if (!lensman) return Response.json({ error: 'Creator not found.' }, { status: 404 });

    const result = await emailCreatorStatus(base44, lensman);
    return Response.json(result);
  } catch (error) {
    console.error('notifyCreatorStatus error:', error.message);
    return Response.json({ error: 'The status email could not be sent.' }, { status: 500 });
  }
}
