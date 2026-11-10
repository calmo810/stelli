/**
 * A small Stelli in memory: one client, one creator with payouts on, one
 * founder, and a booking request between them. Tests drive it through the real
 * backend functions, with the fake database and the fake Stripe underneath.
 */
import { createHmac } from 'node:crypto';
import { createFakeBase44 } from './fakeBase44.mjs';
import { installFakeStripe } from './fakeStripe.mjs';

export const CLIENT = { id: 'u_client', email: 'jordan@example.com', full_name: 'Jordan Lee', role: 'user' };
export const CREATOR = { id: 'u_creator', email: 'maya@example.com', full_name: 'Maya Ortiz', role: 'user' };
export const FOUNDER = { id: 'u_founder', email: 'founder@example.com', full_name: 'Founder', role: 'admin' };
export const STRANGER = { id: 'u_other', email: 'someone@example.com', full_name: 'Someone Else', role: 'user' };

const WEBHOOK_SECRET = 'whsec_test_secret';

const handlers = new Map();
/** Loads a backend function by folder name, once. */
export async function fn(name) {
  if (!handlers.has(name)) {
    const module = await import(`../../base44/functions/${name}/entry.ts`);
    handlers.set(name, module.default);
  }
  return handlers.get(name);
}

export async function scenario({ payoutsEnabled = true, eventDate = '2027-06-12', eventTime = '15:00' } = {}) {
  globalThis.__secrets = {
    STRIPE_SECRET_KEY: 'sk_live_fake',
    STRIPE_TEST_SECRET_KEY: 'sk_test_fake',
    STRIPE_LIVE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    BASE44_APP_ID: 'app_test',
  };
  const stripe = installFakeStripe({ livemode: true });
  const db = createFakeBase44();
  const { entities } = db;

  await entities.User.create({ ...CLIENT });
  await entities.User.create({ ...CREATOR });
  await entities.User.create({ ...FOUNDER });

  await entities.Lensman.create({
    id: 'l1',
    user_id: CREATOR.id,
    display_name: 'Maya',
    status: 'approved',
    payouts_enabled: payoutsEnabled,
    stripe_account_id: payoutsEnabled ? 'acct_maya' : '',
  });
  await entities.CreatorContact.create({
    lensman_id: 'l1',
    user_id: CREATOR.id,
    full_name: 'Maya Ortiz',
    email: CREATOR.email,
    phone: '555 0100',
  });
  await entities.LegalDocument.create({ type: 'terms', version: '2026-10-22', effective_date: '2026-10-22' });
  await entities.LegalDocument.create({ type: 'privacy', version: '2026-09-10', effective_date: '2026-09-10' });

  const booking = await entities.Booking.create({
    id: 'b1',
    lensman_id: 'l1',
    lensman_name: 'Maya',
    lensman_email: CREATOR.email,
    creator_id: CREATOR.id,
    creator_email: CREATOR.email,
    client_id: CLIENT.id,
    client_name: 'Jordan Lee',
    client_email: CLIENT.email,
    event_date: eventDate,
    event_time: eventTime,
    event_type: 'Portraits',
    status: 'requested',
    payment_status: 'pending',
  });

  const world = {
    db,
    stripe,
    entities,
    bookingId: booking.id,
    booking: () => entities.Booking.get(booking.id),

    async call(name, body, user) {
      return db.call(await fn(name), body, user);
    },

    /** Delivers a Stripe event to the real webhook, correctly signed. */
    async webhook(type, object, { livemode = true } = {}) {
      const payload = JSON.stringify({ id: `evt_${Math.random()}`, type, livemode, data: { object } });
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = createHmac('sha256', WEBHOOK_SECRET).update(`${timestamp}.${payload}`).digest('hex');
      globalThis.__base44 = db;
      const handler = await fn('stripeWebhook');
      const response = await handler(
        new Request('https://stelli.test/webhook', {
          method: 'POST',
          headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` },
          body: payload,
        })
      );
      return { status: response.status, data: await response.json() };
    },

    /** Creator quotes, client accepts (with add-ons) and opens Checkout. */
    async quoteAndAccept({ amount = 100, addOns = [], pick = [] } = {}) {
      const sent = await world.call('sendQuote', { bookingId: booking.id, amount, addOns }, CREATOR);
      if (sent.status !== 200) throw new Error(`sendQuote: ${sent.data.error}`);
      const accepted = await world.call(
        'acceptQuote',
        { quoteId: sent.data.quote.id, pickedAddOns: pick.map((name) => ({ name })) },
        CLIENT
      );
      if (accepted.status !== 200) throw new Error(`acceptQuote: ${accepted.data.error}`);
      return sent.data.quote;
    },

    async checkout(user = CLIENT) {
      return world.call('createBookingCheckout', { bookingId: booking.id, origin: 'https://getstelli.com' }, user);
    },

    /** The client pays the open session by card and Stripe tells the webhook. */
    async pay(sessionId) {
      const session = stripe.pay(sessionId);
      return world.webhook('checkout.session.completed', session);
    },

    /** The whole road to a paid, confirmed booking. Returns the session. */
    async paid(options) {
      await world.quoteAndAccept(options);
      const checkout = await world.checkout();
      if (checkout.status !== 200) throw new Error(`checkout: ${checkout.data.error}`);
      await world.pay(checkout.data.sessionId);
      return stripe.sessions.get(checkout.data.sessionId);
    },

    /** Paid and delivered, with the 48 hour window already closed. */
    async deliveredAndDue(options) {
      const session = await world.paid(options);
      const deliveredAt = new Date(Date.now() - 50 * 3_600_000).toISOString();
      await entities.Booking.update(booking.id, {
        status: 'delivered',
        delivery_link: 'https://gallery.example/album',
        delivered_at: deliveredAt,
        release_due_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      });
      return session;
    },

    emailsTo(address) {
      return db.emails.filter((email) => email.to === address);
    },
  };

  return world;
}
