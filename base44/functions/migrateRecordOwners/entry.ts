import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logAdminAction, requireAdmin } from '../../shared/audit.ts';

/**
 * One-off data move for account-based access (REVIEW.md, decision D5).
 * Founders only. Safe to run more than once: a record already right is left
 * alone. Run with { dryRun: true } first — it is the default — to see the
 * counts without writing anything.
 *
 * Who may read a booking, quote, message, agreement, photo release or
 * delivery photo is now decided by account IDs only, never by email. Some
 * older records are missing an ID, or carry the creator PROFILE's ID where the
 * creator's ACCOUNT ID belongs. This fills them in:
 *
 *   Booking         client_id   from the account with the booking's client email
 *                   creator_id  from the creator profile's owner (Lensman.user_id),
 *                               else the account with the creator email
 *   Quote, Message,
 *   PhotoRelease,
 *   DeliveryPhoto   client_id, creator_id  copied from their booking
 *   BookingContract creator_user_id        copied from its booking (or the profile's owner)
 *
 * Anything it can't resolve is listed by record ID (no names or emails) so a
 * founder can look at it.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await requireAdmin(base44);
    if (!user) return Response.json({ error: 'Admins only.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false;
    const db = base44.asServiceRole.entities;

    const users = await db.User.list('-created_date', 5000);
    const userIds = new Set(users.map((u) => u.id));
    const idByEmail = new Map(users.filter((u) => u.email).map((u) => [String(u.email).toLowerCase(), u.id]));
    const lensmen = await db.Lensman.list('-created_date', 2000);
    const ownerByLensman = new Map(lensmen.map((l) => [l.id, l.user_id || '']));

    const lookup = (email) => idByEmail.get(String(email || '').toLowerCase()) || '';
    const report = { dryRun, bookings: 0, quotes: 0, messages: 0, releases: 0, photos: 0, contracts: 0, unresolved: [] };
    const write = async (entity, id, patch, counter) => {
      report[counter] += 1;
      if (!dryRun) await db[entity].update(id, patch);
    };

    // 1. Bookings first: everything else copies from them.
    const bookings = await db.Booking.list('-created_date', 5000);
    const fixed = new Map();
    for (const booking of bookings) {
      let clientId = booking.client_id || '';
      if (!userIds.has(clientId)) clientId = lookup(booking.client_email) || clientId;

      let creatorId = booking.creator_id || '';
      if (!userIds.has(creatorId)) {
        creatorId =
          ownerByLensman.get(booking.lensman_id) ||
          lookup(booking.creator_email) ||
          lookup(booking.lensman_email) ||
          creatorId;
      }

      if (!userIds.has(clientId) || !userIds.has(creatorId)) {
        report.unresolved.push({ entity: 'Booking', id: booking.id, missing: !userIds.has(clientId) ? 'client' : 'creator' });
      }
      const patch: Record<string, any> = {};
      if (clientId && clientId !== booking.client_id) patch.client_id = clientId;
      if (creatorId && creatorId !== booking.creator_id) patch.creator_id = creatorId;
      if (Object.keys(patch).length) await write('Booking', booking.id, patch, 'bookings');
      fixed.set(booking.id, { client_id: clientId, creator_id: creatorId, lensman_id: booking.lensman_id });
    }

    // 2. Records that belong to a booking take its IDs.
    const follow = async (entity, counter) => {
      const rows = await db[entity].list('-created_date', 5000);
      for (const row of rows) {
        const owner = fixed.get(row.booking_id);
        if (!owner) {
          if (!userIds.has(row.client_id) || !userIds.has(row.creator_id)) {
            report.unresolved.push({ entity, id: row.id, missing: 'booking' });
          }
          continue;
        }
        const patch: Record<string, any> = {};
        if (owner.client_id && row.client_id !== owner.client_id) patch.client_id = owner.client_id;
        if (owner.creator_id && row.creator_id !== owner.creator_id) patch.creator_id = owner.creator_id;
        if (Object.keys(patch).length) await write(entity, row.id, patch, counter);
      }
    };
    await follow('Quote', 'quotes');
    await follow('Message', 'messages');
    await follow('PhotoRelease', 'releases');
    await follow('DeliveryPhoto', 'photos');

    // 3. Agreements keep creator_id as the profile ID (other code reads it that
    //    way) and get the creator's account in creator_user_id.
    const contracts = await db.BookingContract.list('-created_date', 5000);
    for (const contract of contracts) {
      const owner = fixed.get(contract.booking_id);
      const creatorUserId = owner?.creator_id || ownerByLensman.get(contract.creator_id) || '';
      const patch: Record<string, any> = {};
      if (creatorUserId && contract.creator_user_id !== creatorUserId) patch.creator_user_id = creatorUserId;
      if (owner?.client_id && contract.client_id !== owner.client_id) patch.client_id = owner.client_id;
      if (!creatorUserId) report.unresolved.push({ entity: 'BookingContract', id: contract.id, missing: 'creator' });
      if (Object.keys(patch).length) await write('BookingContract', contract.id, patch, 'contracts');
    }

    if (!dryRun) {
      await logAdminAction(base44, user, {
        action: 'migrate_data',
        summary: `Filled in account IDs: ${report.bookings} bookings, ${report.quotes} quotes, ${report.messages} messages, ${report.releases} photo releases, ${report.photos} photos, ${report.contracts} agreements. ${report.unresolved.length} could not be resolved.`,
        details: report,
      });
    }

    return Response.json(report);
  } catch (error) {
    console.error('migrateRecordOwners error:', error.message);
    return Response.json({ error: 'The data fix stopped partway. Records before the failure were written; it is safe to run again.' }, { status: 500 });
  }
}
