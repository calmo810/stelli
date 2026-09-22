/** Mirrors base44/shared/stripe.ts so the thread can show the same numbers. */
export const SERVICE_FEE_RATE = 0.14;

export function serviceFee(amount) {
  return Math.round(Number(amount || 0) * SERVICE_FEE_RATE * 100) / 100;
}

export function clientTotal(amount) {
  return Math.round((Number(amount || 0) + serviceFee(amount)) * 100) / 100;
}

export function creatorPayout(amount) {
  return Math.round(Number(amount || 0) * (1 - SERVICE_FEE_RATE) * 100) / 100;
}