import { secrets } from 'base44:runtime';
import { clientFeeCents, creatorPayoutCents, fromCents, toCents } from './money.ts';

export { SERVICE_FEE_RATE, money, toCents } from './money.ts';

/** How long the client has to report a problem before the payout releases. */
export const HOLD_HOURS = 48;

/**
 * Which Stripe mode this app is running in.
 *
 * Stelli takes real payments, so live is the default whenever a live key is
 * stored. Setting the secret STRIPE_MODE to "test" switches the whole app to
 * the test keys without deleting the live one — that is how the payment flow
 * is rehearsed. Anything other than "test" leaves the default alone.
 */
export function stripeMode() {
  const forced = String(secrets.get('STRIPE_MODE') || '').trim().toLowerCase();
  if (forced === 'test' && secrets.get('STRIPE_TEST_SECRET_KEY')) return 'test';
  return secrets.get('STRIPE_SECRET_KEY') ? 'live' : 'test';
}

export function stripeKey() {
  return stripeMode() === 'live'
    ? secrets.get('STRIPE_SECRET_KEY')
    : secrets.get('STRIPE_TEST_SECRET_KEY');
}

/** True when a Stripe object (event, session, charge) belongs to the mode in use. */
export function sameStripeMode(livemode) {
  return Boolean(livemode) === (stripeMode() === 'live');
}

export function webhookSecret() {
  return (
    secrets.get('STRIPE_LIVE_WEBHOOK_SECRET') ||
    secrets.get('STRIPE_WEBHOOK_SECRET') ||
    secrets.get('STRIPE_TEST_WEBHOOK_SECRET')
  );
}

/**
 * Dollar-in, dollar-out helpers kept for the older call sites. The real
 * arithmetic lives in money.ts and is done in whole cents.
 */
export function serviceFee(amount) {
  return fromCents(clientFeeCents(toCents(amount)));
}

/** Subtotal plus the service fee — the full amount charged at checkout, before tax. */
export function clientTotal(amount) {
  const cents = toCents(amount);
  return fromCents(cents + clientFeeCents(cents));
}

/** What the creator receives once the hold is released. */
export function creatorPayout(amount) {
  return fromCents(creatorPayoutCents(toCents(amount)));
}

/**
 * Connected accounts are created with Accounts v2, which is still a preview
 * API, so its requests pin the preview version. Everything else stays on the
 * released version.
 */
const STRIPE_VERSION = '2025-10-29.clover';
const STRIPE_PREVIEW_VERSION = '2025-10-29.preview';

export async function stripePost(path, params, idempotencyKey) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      'Stripe-Version': STRIPE_VERSION,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: params,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`Stripe ${path} failed:`, data?.error?.message);
    throw stripeError(response, data);
  }

  return data;
}

export async function stripeGet(path) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      'Stripe-Version': STRIPE_VERSION,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`Stripe GET ${path} failed:`, data?.error?.message);
    throw stripeError(response, data);
  }

  return data;
}

/** Accounts v2: a JSON body and the pinned preview version. */
export async function stripeV2Post(path, body) {
  const response = await fetch(`https://api.stripe.com/v2/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      'Stripe-Version': STRIPE_PREVIEW_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`Stripe v2 ${path} failed:`, data?.error?.message);
    throw stripeError(response, data);
  }

  return data;
}

/**
 * A Stripe failure, with enough on it to decide what to do next.
 *
 * `definitive` means Stripe looked at the request and said no (a 4xx such as
 * a restricted account or a missing balance): nothing was created, and a later
 * attempt should use a fresh idempotency key. Anything else — a 5xx, a rate
 * limit, a conflict — may or may not have gone through, so a retry must reuse
 * the same key.
 */
function stripeError(response, data) {
  const error = new Error(data?.error?.message || 'Stripe request failed');
  error.status = response.status;
  error.code = data?.error?.code || '';
  error.definitive =
    response.status >= 400 && response.status < 500 && ![409, 429].includes(response.status);
  return error;
}
