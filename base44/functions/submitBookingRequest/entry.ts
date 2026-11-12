import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { resolveCreatorOwner } from '../../shared/creatorOwner.ts';
import { hasDirectContact, CONTACT_BLOCK_MESSAGE } from '../../shared/contactGuard.ts';
import { shootDayEndMs } from '../../shared/shootTime.ts';

const MAX = { brief: 2000, location: 200, eventType: 80, clientName: 80, budget: 120, duration: 60 };

/** How far ahead a request can be made. Catches a mistyped year. */
const MAX_DAYS_AHEAD = 730;

/** A second identical request inside this window is the same tap, twice. */
const DOUBLE_TAP_MS = 2 * 60 * 1000;

/**
 * A client asking a creator about a date. Nothing is charged here.
 *
 * Checked on the server, whatever the form allowed:
 *  - the creator is approved and not on hold (a pending, rejected or held
 *    profile can't be booked by guessing its ID);
 *  - you can't book yourself;
 *  - the date is a real date, not in the past;
 *  - the note carries no contact details — those unlock once the booking is
 *    confirmed, and the brief is the first thing the creator reads;
 *  - the same request sent twice in a row creates one booking, one email.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Please sign in to send this request.' }, { status: 401 });
    }

    const body = await req.json();
    const lensmanId = String(body.lensmanId || '');
    const eventDate = String(body.eventDate || '').trim();
    const eventTime = String(body.eventTime || '').trim();
    const brief = String(body.brief || '').trim();
    const location = String(body.location || '').trim().slice(0, MAX.location);
    const eventType = String(body.eventType || '').trim().slice(0, MAX.eventType);
    // In the client's own words, both optional.
    const budget = String(body.budget || '').trim().slice(0, MAX.budget);
    const duration = String(body.duration || '').trim().slice(0, MAX.duration);

    if (!lensmanId || !eventDate || !brief) {
      return Response.json({ error: 'A date and what you are planning are required.' }, { status: 400 });
    }
    if (brief.length > MAX.brief) {
      return Response.json({ error: `Keep your note to ${MAX.brief} characters or fewer.` }, { status: 400 });
    }

    const dayEnd = /^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? shootDayEndMs(eventDate) : NaN;
    if (!Number.isFinite(dayEnd)) {
      return Response.json({ error: 'Pick a date for the shoot.' }, { status: 400 });
    }
    if (dayEnd < Date.now()) {
      return Response.json({ error: 'That date has already passed. Pick a date from today on.' }, { status: 400 });
    }
    if (dayEnd > Date.now() + MAX_DAYS_AHEAD * 86_400_000) {
      return Response.json({ error: 'That date is more than two years away. Check the year.' }, { status: 400 });
    }
    if (eventTime && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(eventTime)) {
      return Response.json({ error: 'Pick a start time, or leave it blank.' }, { status: 400 });
    }

    if ([brief, location, eventType, budget, duration].some((text) => hasDirectContact(text))) {
      return Response.json({ error: CONTACT_BLOCK_MESSAGE, blocked: true }, { status: 400 });
    }

    // Stelli is for adults. An account that has never confirmed it does so
    // here, once; the confirmation is kept on the account.
    if (user.age_confirmed !== true) {
      if (body.ageConfirmed !== true) {
        return Response.json(
          { error: "Confirm you're 18 or older to send a request.", needsAge: true },
          { status: 400 }
        );
      }
      await base44.asServiceRole.entities.User.update(user.id, { age_confirmed: true }).catch((error) =>
        console.error('Age confirmation not saved -', error.message)
      );
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId).catch(() => null);
    if (!lensman || lensman.status !== 'approved' || lensman.under_review) {
      return Response.json({ error: 'That creator is not taking requests right now.' }, { status: 404 });
    }

    // File the request against the account that owns this creator profile,
    // not the contact email typed on the public profile.
    const owner = await resolveCreatorOwner(base44, lensman);
    if (owner.ownerId === user.id || (owner.ownerEmail && owner.ownerEmail === user.email)) {
      return Response.json({ error: 'You can’t send a request to your own profile.' }, { status: 400 });
    }

    const Booking = base44.asServiceRole.entities.Booking;

    // The same request, sent twice in a row: hand back the first.
    const recent = await Booking.filter(
      { client_id: user.id, lensman_id: lensmanId, event_date: eventDate, status: 'requested' },
      '-created_date',
      5
    );
    const same = recent.find(
      (b) =>
        b.event_description === brief &&
        Date.now() - new Date(b.created_date || 0).getTime() < DOUBLE_TAP_MS
    );
    if (same) return Response.json({ booking: same, duplicate: true });

    const name =
      String(body.clientName || user.full_name || '').trim().slice(0, MAX.clientName) || 'Stelli client';

    const booking = await Booking.create({
      lensman_id: lensmanId,
      lensman_name: lensman.display_name || 'Stelli creator',
      lensman_email: owner.ownerEmail,
      creator_id: owner.ownerId,
      creator_email: owner.ownerEmail,
      client_id: user.id,
      client_name: name,
      client_email: user.email,
      event_date: eventDate,
      event_time: eventTime,
      event_type: eventType || 'Custom shoot',
      location,
      event_description: brief,
      budget,
      duration,
      status: 'requested',
      payment_status: 'pending',
      client_last_read_at: new Date().toISOString(),
    });

    const clientFirst = name.split(' ')[0];

    await notifyBoth(
      base44,
      [owner.ownerEmail],
      `New request from ${clientFirst} for ${eventDate}`,
      `New request from ${clientFirst} for ${eventDate}. Reply in Stelli to work out the details and send your quote.`
    );

    await Booking.update(booking.id, { creator_notified_at: new Date().toISOString() });

    return Response.json({ booking });
  } catch (error) {
    console.error('submitBookingRequest error:', error.message);
    return Response.json({ error: 'We could not send your request. Please try again.' }, { status: 500 });
  }
}
