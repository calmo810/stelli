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

export async function stripePost(path, params, idempotencyKey) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      'Stripe-Version': '2025-10-29.clover',
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
      'Stripe-Version': '2025-10-29.clover',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`Stripe GET ${path} failed:`, data?.error?.message);
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