import { secrets } from 'base44:runtime';

/** Stelli's cut of every booking, taken from both sides. */
export const SERVICE_FEE_RATE = 0.14;

/** How long the client has to report a problem before the payout releases. */
export const HOLD_HOURS = 48;

/**
 * Stelli takes real payments, so the live keys come first. The test keys are
 * only a fallback for a build that has no live key stored.
 */
export function stripeKey() {
  return secrets.get('STRIPE_SECRET_KEY') || secrets.get('STRIPE_TEST_SECRET_KEY');
}

export function stripeMode() {
  return secrets.get('STRIPE_SECRET_KEY') ? 'live' : 'test';
}

export function webhookSecret() {
  return (
    secrets.get('STRIPE_LIVE_WEBHOOK_SECRET') ||
    secrets.get('STRIPE_WEBHOOK_SECRET') ||
    secrets.get('STRIPE_TEST_WEBHOOK_SECRET')
  );
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
    throw new Error(data?.error?.message || 'Stripe request failed');
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
    throw new Error(data?.error?.message || 'Stripe request failed');
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
    throw new Error(data?.error?.message || 'Stripe request failed');
  }

  return data;
}

/** $450 for whole dollars, $450.50 once there are cents. */
export function money(amount) {
  const value = Number(amount || 0);
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}