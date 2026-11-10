import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyThread } from '../../shared/notify.ts';
import { viewerRole, recordFirstReply, creatorEmail } from '../../shared/bookingAccess.ts';
import { stripeGet, stripePost } from '../../shared/stripe.ts';
import { quoteBlocker } from '../../shared/bookingRules.ts';
import { addOnsProblem, cleanAddOns, money, quoteAmountProblem } from '../../shared/money.ts';

/** Quotes stay valid for 72 hours unless the creator picks otherwise. */
const EXPIRY_HOURS = { '24h': 24, '72h': 72, '7d': 168 };

const MAX_NOTE = 1000;
const MAX_INCLUDED_EDITS = 2000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, amount, message, includedEdits, addOns, expiry } = await req.json();
    if (!bookingId) {
      return Response.json({ error: 'A booking and an amount are required.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const role = viewerRole(booking, user);
    if (role !== 'lensman' && user.role !== 'admin') {
      return Response.json({ error: 'Only the booked creator can quote this request.' }, { status: 403 });
    }

    // A quote can only go out on a booking that is still open and unpaid. It
    // can't reopen a cancelled booking or reprice a paid one.
    const blocker = quoteBlocker(booking);
    if (blocker) return Response.json({ error: blocker }, { status: 409 });

    // The price is checked before anything is stored: a positive amount in
    // dollars and cents, and add-ons that are $0 or more.
    const amountProblem = quoteAmountProblem(amount);
    if (amountProblem) return Response.json({ error: amountProblem }, { status: 400 });
    const addOnProblem = addOnsProblem(addOns);
    if (addOnProblem) return Response.json({ error: addOnProblem }, { status: 400 });

    // Payouts come before quoting — the money has to have somewhere to land.
    // Checked before the old quote is touched, so a refusal changes nothing.
    const lensman = await base44.asServiceRole.entities.Lensman.get(booking.lensman_id).catch(() => null);
    if (lensman && !lensman.payouts_enabled && user.role !== 'admin') {
      return Response.json(
        { error: 'Set up payouts to send your first quote.', needsPayouts: true },
        { status: 403 }
      );
    }

    // Any checkout page open for the old quote is closed. If the client has
    // already finished paying on it, the price is settled: no new quote.
    const openSessionId = booking.stripe_checkout_session_id || '';
    if (openSessionId) {
      try {
        await stripePost(`checkout/sessions/${openSessionId}/expire`, new URLSearchParams());
      } catch (error) {
        const session = await stripeGet(`checkout/sessions/${openSessionId}`).catch(() => null);
        if (session?.status === 'complete') {
          return Response.json(
            { error: 'Your client just paid the current quote. Message Stelli to change the price.' },
            { status: 409 }
          );
        }
        // Still payable, or unknown. It is no longer the session on record
        // (cleared below), so a payment through it will not confirm this
        // booking — it is held apart for a founder instead.
        console.error('Could not expire checkout session', openSessionId, '-', error.message);
      }
    }

    // An accepted quote that hasn't been paid is replaced by the new one, and
    // so is any other quote still waiting on the client: one live quote at a time.
    await base44.asServiceRole.entities.Quote.updateMany(
      { booking_id: bookingId, status: 'accepted' },
      { $set: { status: 'superseded' } }
    );
    await base44.asServiceRole.entities.Quote.updateMany(
      { booking_id: bookingId, status: 'sent' },
      { $set: { status: 'superseded' } }
    );

    const hours = EXPIRY_HOURS[expiry] || EXPIRY_HOURS['72h'];
    const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();

    const cleanedAddOns = cleanAddOns(addOns);
    const note = String(message || '').trim().slice(0, MAX_NOTE);
    const edits = Math.min(MAX_INCLUDED_EDITS, Math.max(0, Math.round(Number(includedEdits) || 30)));

    const quote = await base44.asServiceRole.entities.Quote.create({
      booking_id: bookingId,
      creator_id: booking.creator_id || '',
      client_id: booking.client_id || '',
      client_email: booking.client_email,
      creator_email: creatorEmail(booking),
      amount: Math.round(Number(amount) * 100) / 100,
      message: note,
      included_edits: edits,
      add_ons: cleanedAddOns,
      expires_at: expiresAt,
      status: 'sent',
    });

    // The agreement written for the old quote no longer describes this booking.
    const contracts = await base44.asServiceRole.entities.BookingContract.filter({ booking_id: bookingId });
    for (const contract of contracts) {
      if (contract.status === 'superseded') continue;
      await base44.asServiceRole.entities.BookingContract.update(contract.id, {
        status: 'superseded',
        superseded_at: new Date().toISOString(),
      });
    }

    // Nothing is accepted any more: no quote, no add-ons, no agreement, no
    // session on record.
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      status: 'quoted',
      total_price: quote.amount,
      quote_id: '',
      picked_add_ons: [],
      stripe_checkout_session_id: '',
      contract_id: '',
      client_contract_accepted: false,
      creator_contract_accepted: false,
    });

    await recordFirstReply(base44, booking);

    const lines = [
      `Your quote from ${booking.lensman_name || 'your creator'} is ready.`,
      '',
      `Shoot date: ${booking.event_date}`,
      `Amount: ${money(quote.amount)}`,
      `Edited photos included: ${quote.included_edits}`,
      cleanedAddOns.length
        ? `Add-ons: ${cleanedAddOns.map((a) => `${a.name} (+${money(a.price)})`).join(', ')}`
        : '',
      `Expires: ${new Date(expiresAt).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}`,
      note ? `\nNote from your creator: ${note}` : '',
      '',
      'Accept it in your Stelli messages to lock the date and pay.',
    ].filter(Boolean);

    await notifyThread(base44, booking, {
      to: booking.client_email,
      role: 'client',
      sinceIso: quote.created_date || new Date().toISOString(),
      subject: 'Your Stelli quote',
      body: lines.join('\n'),
    });

    return Response.json({ quote });
  } catch (error) {
    console.error('sendQuote error:', error.message);
    return Response.json({ error: 'The quote did not send. Try again.' }, { status: 500 });
  }
}
