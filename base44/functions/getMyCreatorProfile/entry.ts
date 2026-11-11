import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * The signed-in creator's own profile, in full.
 *
 * Some fields on a creator record are readable by founders only (payout
 * status, the Stripe account, whether they are on hold, their packages), so
 * that nobody browsing can see them. The creator still needs them about
 * themselves — the dashboard shows payout setup and the profile editor
 * prefills the packages — so their own record comes through here, found by
 * the account that owns it. Nobody else's.
 *
 * The private contact record comes back without the founders' notes.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const [lensman] = await base44.asServiceRole.entities.Lensman.filter({ user_id: user.id });
    if (!lensman) return Response.json({ lensman: null, contact: null });

    const contacts = await base44.asServiceRole.entities.CreatorContact.filter({ lensman_id: lensman.id });
    const contact = contacts.find((c) => c.user_id === user.id) || contacts[0] || null;

    return Response.json({
      lensman,
      contact: contact
        ? {
            id: contact.id,
            full_name: contact.full_name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            instagram: contact.instagram || '',
          }
        : null,
    });
  } catch (error) {
    console.error('getMyCreatorProfile error:', error.message);
    return Response.json({ error: 'Your profile could not be loaded. Try again.' }, { status: 500 });
  }
}
