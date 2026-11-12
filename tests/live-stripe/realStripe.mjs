/**
 * Stelli's real backend functions against REAL Stripe, in test mode only.
 *
 * The database is the same in-memory Base44 the other tests use; Stripe is
 * not faked at all. Every call goes to api.stripe.com with a test secret key,
 * and Stripe's own events are read back and fed to the real webhook handler.
 *
 * Opt-in: `npm run test:stripe`. It needs a Stripe TEST secret key that the
 * environment's network proxy adds to requests (or STRIPE_TEST_SECRET_KEY set
 * in the shell). Before anything runs it asks Stripe which mode the key is in
 * and stops unless the answer is test mode; every Stripe response is checked
 * again on the way back, and a live object stops the run on the spot.
 *
 * One step is simulated: the client typing a card into Stripe's hosted
 * Checkout page. That page can't be driven from a headless browser here, so
 * the payment is made as a real test charge for exactly the Checkout session's
 * amount, with the same transfer group and metadata Checkout would use, and
 * the webhook is handed the real session marked as paid by that charge.
 */
import { createHmac } from 'node:crypto';
import { createFakeBase44 } from '../helpers/fakeBase44.mjs';
import { CLIENT, CREATOR, FOUNDER, fn } from '../helpers/scenario.mjs';

export { CLIENT, CREATOR, FOUNDER };

const KEY = process.env.STRIPE_TEST_SECRET_KEY || 'sk_test_proxy-injected';
const API = 'https://api.stripe.com/';
const WEBHOOK_SECRET = 'whsec_stelli_harness_local';
export const APP_ID = 'stelli-stripe-harness';
export const RUN = `h${Date.now().toString(36)}`;
const startedAt = Math.floor(Date.now() / 1000) - 5;

if (/^sk_live_|^rk_live_/.test(KEY)) {
  console.error('A live Stripe key was given. This harness only runs in test mode.');
  process.exit(2);
}

// Every Stripe response is checked: a live object ends the run immediately.
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const target = String(url);
  if (target.startsWith(API)) {
    init = { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${KEY}` } };
  }
  const response = await realFetch(url, init);
  if (target.startsWith(API)) {
    const body = await response.clone().json().catch(() => null);
    if (body && body.livemode === true) {
      console.error(`Stripe answered with a LIVE object from ${target}. Stopping.`);
      process.exit(2);
    }
  }
  return response;
};

/** A plain Stripe call for the harness itself (setting up, checking results). */
export async function stripe(method, path, params = {}) {
  const body = new URLSearchParams();
  const add = (prefix, value) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) add(prefix ? `${prefix}[${k}]` : k, v);
    } else body.append(prefix, String(value));
  };
  add('', params);
  const url = `${API}v1/${path}${method === 'GET' && body.toString() ? `?${body}` : ''}`;
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Stripe-Version': '2025-10-29.clover' },
    ...(method === 'GET' ? {} : { body }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Stripe ${method} ${path}: ${data?.error?.message}`);
  return data;
}

export async function assertTestMode() {
  const balance = await stripe('GET', 'balance');
  if (balance.livemode !== false) {
    console.error('Stripe did not confirm test mode. Stopping before anything runs.');
    process.exit(2);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits for Stripe's own event of this type about this object. */
export async function waitForEvent(type, matches, { timeoutMs = 90_000 } = {}) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const page = await stripe('GET', 'events', { type, 'created[gte]': startedAt, limit: 100 });
    const found = page.data.find((event) => matches(event.data.object));
    if (found) return found;
    await sleep(2000);
  }
  throw new Error(`No ${type} event from Stripe within ${timeoutMs / 1000}s`);
}

let worlds = 0;

/** A fresh Stelli in memory, talking to real Stripe. */
export async function world({ creatorAccount = '', eventDate = '2027-06-12', eventTime = '15:00' } = {}) {
  worlds += 1;
  const prefix = `${RUN}w${worlds}_`;
  globalThis.__idPrefix = prefix;
  globalThis.__secrets = {
    STRIPE_MODE: 'test',
    STRIPE_TEST_SECRET_KEY: KEY,
    STRIPE_TEST_WEBHOOK_SECRET: WEBHOOK_SECRET,
    BASE44_APP_ID: APP_ID,
  };
  const db = createFakeBase44();
  const { entities } = db;
  await entities.User.create({ ...CLIENT });
  await entities.User.create({ ...CREATOR });
  await entities.User.create({ ...FOUNDER });
  await entities.Lensman.create({
    id: `${prefix}l1`,
    user_id: CREATOR.id,
    display_name: 'Maya',
    status: 'approved',
    // The creator can quote (Stelli requires payouts set up first); which
    // Stripe account the money goes to is up to the test.
    payouts_enabled: true,
    stripe_account_id: creatorAccount,
  });
  await entities.CreatorContact.create({
    lensman_id: `${prefix}l1`,
    user_id: CREATOR.id,
    full_name: 'Maya Ortiz',
    email: CREATOR.email,
    phone: '555 0100',
  });
  await entities.LegalDocument.create({ type: 'terms', version: '2026-10-22', effective_date: '2026-10-22' });
  await entities.LegalDocument.create({ type: 'privacy', version: '2026-09-10', effective_date: '2026-09-10' });
  const bookingId = `${prefix}b1`;
  await entities.Booking.create({
    id: bookingId,
    lensman_id: `${prefix}l1`,
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

  const w = {
    db,
    entities,
    bookingId,
    booking: () => entities.Booking.get(bookingId),
    async call(name, body, user) {
      return db.call(await fn(name), body, user);
    },

    /** Hands the real webhook handler an event, signed as Stripe would sign it. */
    async deliver(event) {
      const payload = JSON.stringify(event);
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

    async quoteAndAccept({ amount = 100, addOns = [], pick = [] } = {}) {
      const sent = await w.call('sendQuote', { bookingId, amount, addOns }, CREATOR);
      if (sent.status !== 200) throw new Error(`sendQuote: ${sent.data.error}`);
      const accepted = await w.call(
        'acceptQuote',
        { quoteId: sent.data.quote.id, pickedAddOns: pick.map((name) => ({ name })) },
        CLIENT
      );
      if (accepted.status !== 200) throw new Error(`acceptQuote: ${accepted.data.error}`);
      return sent.data.quote;
    },

    async checkout() {
      return w.call('createBookingCheckout', { bookingId, origin: 'https://getstelli.com' }, CLIENT);
    },

    /**
     * The client pays the Checkout session: a real test charge for exactly
     * the session's amount (see the note at the top), then the webhook gets
     * the real session marked as paid. `token` picks the test card:
     * tok_visa pays; tok_createDispute pays and then opens a card dispute.
     */
    async pay(sessionId, { token = 'tok_visa' } = {}) {
      const session = await stripe('GET', `checkout/sessions/${sessionId}`);
      const method = await stripe('POST', 'payment_methods', { type: 'card', card: { token } });
      const intent = await stripe('POST', 'payment_intents', {
        amount: session.amount_total,
        currency: session.currency,
        payment_method: method.id,
        'payment_method_types[]': 'card',
        confirm: 'true',
        transfer_group: `booking_${session.metadata.booking_id}`,
        metadata: {
          base44_app_id: session.metadata.base44_app_id,
          booking_id: session.metadata.booking_id,
          quote_id: session.metadata.quote_id,
          checkout_session: session.id,
        },
      });
      if (intent.status !== 'succeeded') throw new Error(`Test charge did not succeed: ${intent.status}`);
      const paid = { ...session, status: 'complete', payment_status: 'paid', payment_intent: intent.id };
      const delivered = await w.deliver({
        id: `evt_harness_${intent.id}`,
        object: 'event',
        type: 'checkout.session.completed',
        livemode: false,
        created: Math.floor(Date.now() / 1000),
        data: { object: paid },
      });
      return { session: paid, intent, delivered };
    },

    /** Paid and confirmed: quote, accept, checkout, pay. */
    async paid(options = {}, payOptions = {}) {
      await w.quoteAndAccept(options);
      const checkout = await w.checkout();
      if (checkout.status !== 200) throw new Error(`checkout: ${checkout.data.error}`);
      return w.pay(checkout.data.sessionId, payOptions);
    },

    async deliveredAndDue() {
      await entities.Booking.update(bookingId, {
        status: 'delivered',
        delivery_link: 'https://gallery.example/album',
        delivered_at: new Date(Date.now() - 50 * 3_600_000).toISOString(),
        release_due_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      });
    },

    /** Everything Stripe holds about a charge's refunds, read from Stripe. */
    async chargeOf(intentId) {
      const intent = await stripe('GET', `payment_intents/${intentId}`);
      return stripe('GET', `charges/${intent.latest_charge}`);
    },
  };
  return w;
}
