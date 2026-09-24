import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * One-off data move for the CreatorContact split. Safe to run more than once.
 *
 *  1. Gives every creator a display name (first word of their real name).
 *  2. Copies their private details into a CreatorContact record.
 *  3. Removes those fields from the public Lensman record.
 *  4. Backfills client/creator user IDs on quotes and messages.
 *  5. Zeroes the rating on creators with no reviews.
 *  6. Moves anyone on the retired cream theme to night flash.
 *
 * Run with { dryRun: true } first to see the counts without writing.
 */

const PRIVATE_FIELDS = ['full_name', 'email', 'phone', 'instagram', 'admin_notes', 'review_note'];

function firstWord(value) {
  return String(value || '').trim().split(/\s+/)[0] || '';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admins only.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);

    const lensmen = await base44.asServiceRole.entities.Lensman.list('-created_date', 500);
    const contacts = await base44.asServiceRole.entities.CreatorContact.list('-created_date', 500);
    const byLensmanId = new Map(contacts.map((c) => [c.lensman_id, c]));

    const report = { contactsCreated: 0, contactsUpdated: 0, lensmanUpdated: 0, quotesFixed: 0, messagesFixed: 0, ratingsZeroed: 0, themesMoved: 0 };

    for (const lensman of lensmen) {
      const patch = {};
      const privatePatch = {};

      if (!String(lensman.display_name || '').trim()) {
        const fallback = firstWord(lensman.full_name) || 'Stelli creator';
        patch.display_name = fallback;
      }

      for (const field of PRIVATE_FIELDS) {
        const value = lensman[field];
        if (typeof value === 'string' && value.trim()) privatePatch[field] = value.trim();
      }

      let ownerEmail = privatePatch.email || '';
      if (!ownerEmail && lensman.user_id) {
        try {
          const owner = await base44.asServiceRole.entities.User.get(lensman.user_id);
          ownerEmail = owner?.email || '';
        } catch (error) {
          console.error('Owner lookup failed for', lensman.id, '-', error.message);
        }
      }

      if (lensman.profile_theme === 'editorial_cream') {
        patch.profile_theme = 'night_flash';
        report.themesMoved += 1;
      }

      if (!Number(lensman.review_count || 0) && Number(lensman.avg_rating || 0) !== 0) {
        patch.avg_rating = 0;
        report.ratingsZeroed += 1;
      }

      const existingContact = byLensmanId.get(lensman.id);
      const contactPayload = {
        lensman_id: lensman.id,
        user_id: lensman.user_id || '',
        full_name: privatePatch.full_name || existingContact?.full_name || '',
        email: privatePatch.email || existingContact?.email || ownerEmail,
        phone: privatePatch.phone || existingContact?.phone || '',
        instagram: privatePatch.instagram || existingContact?.instagram || '',
        admin_notes: privatePatch.admin_notes || existingContact?.admin_notes || '',
        review_note: privatePatch.review_note || existingContact?.review_note || '',
      };

      if (!dryRun) {
        if (existingContact) {
          await base44.asServiceRole.entities.CreatorContact.update(existingContact.id, contactPayload);
          report.contactsUpdated += 1;
        } else {
          await base44.asServiceRole.entities.CreatorContact.create(contactPayload);
          report.contactsCreated += 1;
        }

        if (Object.keys(patch).length) {
          await base44.asServiceRole.entities.Lensman.update(lensman.id, patch);
        }

        const unset = {};
        for (const field of PRIVATE_FIELDS) {
          if (lensman[field] !== undefined) unset[field] = '';
        }
        if (Object.keys(unset).length) {
          await base44.asServiceRole.entities.Lensman.updateMany({ id: lensman.id }, { $unset: unset });
          report.lensmanUpdated += 1;
        }
      }
    }

    const quotes = await base44.asServiceRole.entities.Quote.list('-created_date', 500);
    for (const quote of quotes) {
      if (quote.client_id && quote.creator_id) continue;
      const booking = await base44.asServiceRole.entities.Booking.get(quote.booking_id).catch(() => null);
      if (!booking) continue;
      if (!dryRun) {
        await base44.asServiceRole.entities.Quote.update(quote.id, {
          client_id: quote.client_id || booking.client_id || '',
          creator_id: quote.creator_id || booking.creator_id || '',
        });
      }
      report.quotesFixed += 1;
    }

    const messages = await base44.asServiceRole.entities.Message.list('-created_date', 500);
    for (const message of messages) {
      if (message.client_id && message.creator_id) continue;
      const booking = await base44.asServiceRole.entities.Booking.get(message.booking_id).catch(() => null);
      if (!booking) continue;
      if (!dryRun) {
        await base44.asServiceRole.entities.Message.update(message.id, {
          client_id: message.client_id || booking.client_id || '',
          creator_id: message.creator_id || booking.creator_id || '',
        });
      }
      report.messagesFixed += 1;
    }

    return Response.json({ dryRun, creators: lensmen.length, ...report });
  } catch (error) {
    console.error('migrateCreatorData error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}