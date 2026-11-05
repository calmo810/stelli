import { createClientFromRequest } from 'npm:@base44/sdk@0.8.59';

/**
 * Deletes the signed-in user's own account.
 *
 * Money in escrow blocks it: a shoot that is paid for but not yet released has
 * to be finished or cancelled first, so nobody's funds are stranded by a
 * closed account. Legal acceptances are kept as records.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== 'DELETE') {
      return Response.json({ error: 'Confirmation is required.' }, { status: 400 });
    }

    // Nothing may be deleted while a card charge is still held on this account.
    const [asClient, asCreator] = await Promise.all([
      base44.entities.Booking.filter({
        client_email: user.email,
        payment_status: { $in: ['held', 'processing'] },
      }),
      base44.entities.Booking.filter({
        creator_email: user.email,
        payment_status: { $in: ['held', 'processing'] },
      }),
    ]);

    if (asClient.length + asCreator.length > 0) {
      return Response.json(
        {
          error:
            'A shoot on this account still has money in escrow. Finish or cancel it before deleting your account.',
        },
        { status: 409 }
      );
    }

    // The creator profile and its private contact record go with the account.
    await base44.asServiceRole.entities.Lensman.deleteMany({ user_id: user.id });
    await base44.asServiceRole.entities.CreatorContact.deleteMany({ user_id: user.id });

    await base44.asServiceRole.entities.User.delete(user.id);

    console.log(`Account deleted: ${user.id}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('deleteMyAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}