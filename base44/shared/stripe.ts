import { secrets } from 'base44:runtime';

/** Stelli's cut of every booking, taken from both sides. */
export const SERVICE_FEE_RATE = 0.14;

/** How long the client has to report a problem before the payout releases. */
export const HOLD_HOURS = 48;

/**
 * Development runs against the test keys, so no real card is ever charged
 * while we build. Drop STRIPE_TEST_SECRET_KEY to go live.
 */
export function stripeKey() {
  return secrets.get('STRIPE_TEST_SECRET_KEY') || secrets.get('STRIPE_SECRET_KEY');
}

export function stripeMode() {
  return secrets.get('STRIPE_TEST_SECRET_KEY') ? 'test' : 'live';
}

/** Test events must never move live bookings, and live events never test ones. */
export function eventMatchesMode(event) {
  return Boolean(event?.livemode) === (stripeMode() === 'live');
}

export function webhookSecret() {
  return secrets.get('STRIPE_TEST_WEBHOOK_SECRET') || secrets.get('STRIPE_WEBHOOK_SECRET');
}

/** What the client is charged on top of the quote. */
export function serviceFee(amount) {
  return Math.round(Number(amount || 0) * SERVICE_FEE_RATE * 100) / 100;
}

/** Quote price plus the service fee — the full amount charged at checkout. */
export function clientTotal(amount) {
  return Math.round((Number(amount || 0) + serviceFee(amount)) * 100) / 100;
}

/** What the creator receives once the hold is released. */
export function creatorPayout(amount) {
  return Math.round(Number(amount || 0) * (1 - SERVICE_FEE_RATE) * 100) / 100;
}

export function toCents(amount) {
  return Math.round(Number(amount || 0) * 100);
}

const STRIPE_VERSION = '2025-10-29.clover';

/** Stripe asks for a retry on rate limits, conflicts and its own 5xx errors. */
const MAX_ATTEMPTS = 3;

function shouldRetry(response) {
  const hint = response.headers.get('stripe-should-retry');
  if (hint === 'true') return true;
  if (hint === 'false') return false;
  return response.status === 409 || response.status === 429 || response.status >= 500;
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One path for every Stripe call. A request is only retried when repeating it
 * cannot do anything twice: reads, and writes that carry an idempotency key.
 */
async function stripeRequest(method, path, params, idempotencyKey) {
  const retryable = method === 'GET' || Boolean(idempotencyKey);
  const headers = {
    Authorization: `Bearer ${stripeKey()}`,
    'Stripe-Version': STRIPE_VERSION,
    ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
  };

  for (let attempt = 1; ; attempt += 1) {
    let response;
    try {
      response = await fetch(`https://api.stripe.com/v1/${path}`, {
        method,
        headers,
        ...(method === 'POST' ? { body: params || new URLSearchParams() } : {}),
      });
    } catch (error) {
      // The network dropped — Stripe may or may not have seen the request.
      if (retryable && attempt < MAX_ATTEMPTS) {
        await pause(500 * 2 ** attempt);
        continue;
      }
      console.error(`Stripe ${method} ${path} could not be reached:`, error.message);
      throw new Error('Stripe could not be reached. Please try again.');
    }

    const data = await response.json().catch(() => ({}));
    if (response.ok) return data;

    if (retryable && attempt < MAX_ATTEMPTS && shouldRetry(response)) {
      await pause(500 * 2 ** attempt);
      continue;
    }

    console.error(`Stripe ${method} ${path} failed:`, data?.error?.message);
    const failure = new Error(data?.error?.message || 'Stripe request failed');
    failure.code = data?.error?.code;
    failure.status = response.status;
    throw failure;
  }
}

export function stripePost(path, params, idempotencyKey) {
  return stripeRequest('POST', path, params, idempotencyKey);
}

export function stripeGet(path) {
  return stripeRequest('GET', path);
}

/** $450 for whole dollars, $450.50 once there are cents. */
export function money(amount) {
  const value = Number(amount || 0);
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}