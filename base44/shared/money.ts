/**
 * Every amount on a booking, worked out in one place.
 *
 * The rule: one subtotal — the accepted quote plus the add-ons the client
 * picked — feeds everything else. The client pays the subtotal plus 14%. The
 * creator receives the subtotal minus 14%.
 *
 * All arithmetic is done in whole cents, so nothing drifts by a penny between
 * the quote card, the Checkout line items, the stored fee and the payout.
 *
 * This file is pure: no secrets, no network, no database. It is imported by
 * the backend functions and exercised directly by tests/money.test.mjs.
 */

/** Stelli's cut of every booking, taken from both sides. */
export const SERVICE_FEE_RATE = 0.14;

/** The same rate in basis points, for integer math. */
const FEE_BPS = 1400;

/** Stripe refuses card charges under 50 cents; a quote below $1 is a typo. */
export const MIN_QUOTE_CENTS = 100;

/** A ceiling that catches a slipped decimal point (Stripe's own limit is higher). */
export const MAX_QUOTE_CENTS = 5_000_000;

export const MAX_ADD_ONS = 10;
export const MAX_ADD_ON_NAME = 80;

/** Dollars (number or numeric string) to whole cents. Garbage becomes 0. */
export function toCents(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

/** Whole cents back to dollars, for storing next to the older dollar fields. */
export function fromCents(cents) {
  return Math.round(Number(cents) || 0) / 100;
}

/** True when a dollar amount has no more than two decimal places. */
export function isWholeCents(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return false;
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

/** What the client is charged on top of the subtotal, in cents. */
export function clientFeeCents(subtotalCents) {
  return Math.round((subtotalCents * FEE_BPS) / 10000);
}

/** What the creator receives once the hold is released, in cents. */
export function creatorPayoutCents(subtotalCents) {
  return Math.round((subtotalCents * (10000 - FEE_BPS)) / 10000);
}

/**
 * Add-ons as stored: a name and a price in dollars. Anything without a name,
 * with a negative or unreadable price, is dropped. Names are trimmed and
 * capped, duplicates (same name) keep the first.
 */
export function cleanAddOns(addOns) {
  if (!Array.isArray(addOns)) return [];
  const seen = new Set();
  const clean = [];
  for (const addOn of addOns) {
    const name = String(addOn?.name ?? '').trim().slice(0, MAX_ADD_ON_NAME);
    const cents = toCents(addOn?.price);
    if (!name || cents < 0 || !isWholeCents(addOn?.price ?? 0)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push({ name, price: fromCents(cents) });
    if (clean.length >= MAX_ADD_ONS) break;
  }
  return clean;
}

/**
 * The add-ons a client may pick: only ones the creator offered on this quote,
 * at the creator's price. The browser sends names; it never sends a price that
 * is believed.
 */
export function pickOfferedAddOns(offered, wanted) {
  const names = new Set(
    (Array.isArray(wanted) ? wanted : []).map((addOn) =>
      String(typeof addOn === 'string' ? addOn : addOn?.name ?? '')
        .trim()
        .toLowerCase()
    )
  );
  return cleanAddOns(offered).filter((addOn) => names.has(addOn.name.toLowerCase()));
}

/**
 * The full breakdown for an accepted quote and the add-ons picked on it.
 * Everything a screen, a contract, a Checkout session or a payout needs.
 */
export function bookingBreakdown(quoteAmount, pickedAddOns) {
  const baseCents = toCents(quoteAmount);
  const addOns = cleanAddOns(pickedAddOns).map((addOn) => ({
    name: addOn.name,
    cents: toCents(addOn.price),
  }));
  const addOnCents = addOns.reduce((sum, addOn) => sum + addOn.cents, 0);
  const subtotalCents = baseCents + addOnCents;
  const feeCents = clientFeeCents(subtotalCents);
  const payoutCents = creatorPayoutCents(subtotalCents);

  return {
    baseCents,
    addOns,
    addOnCents,
    /** The creator's price: quote plus picked add-ons. */
    subtotalCents,
    /** Stelli's fee on the client side, added on top. */
    clientFeeCents: feeCents,
    /** What Checkout charges before tax. */
    clientTotalCents: subtotalCents + feeCents,
    /** Stelli's fee on the creator side, taken out of the subtotal. */
    creatorFeeCents: subtotalCents - payoutCents,
    /** What the creator is transferred. */
    creatorPayoutCents: payoutCents,
  };
}

/** Why a quote amount can't be sent, or '' when it is fine. */
export function quoteAmountProblem(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 'Add a price.';
  if (!isWholeCents(value)) return 'Use dollars and cents, like 250 or 249.50.';
  const cents = toCents(value);
  if (cents < MIN_QUOTE_CENTS) return 'A quote has to be at least $1.';
  if (cents > MAX_QUOTE_CENTS) return 'That price is too high to send. Check the number.';
  return '';
}

/** Why a set of offered add-ons can't be sent, or ''. */
export function addOnsProblem(addOns) {
  if (addOns == null) return '';
  if (!Array.isArray(addOns)) return 'Add-ons could not be read.';
  if (addOns.length > MAX_ADD_ONS) return `A quote can carry up to ${MAX_ADD_ONS} add-ons.`;
  for (const addOn of addOns) {
    const name = String(addOn?.name ?? '').trim();
    if (!name) continue;
    const value = Number(addOn?.price ?? 0);
    if (!Number.isFinite(value) || value < 0) return `"${name}" needs a price of $0 or more.`;
    if (!isWholeCents(value)) return `"${name}" needs a price in dollars and cents.`;
    if (toCents(value) > MAX_QUOTE_CENTS) return `"${name}" is priced too high. Check the number.`;
  }
  return '';
}

/**
 * Does what Stripe says it charged match what this booking should cost?
 *
 * `chargedBeforeTaxCents` is the session's amount_subtotal (line items before
 * tax). Tax is collected on top and is not part of the comparison.
 */
export function chargeMatches(breakdown, chargedBeforeTaxCents) {
  return Number(chargedBeforeTaxCents) === breakdown.clientTotalCents;
}

/**
 * The creator's share of a refund, when they were already paid.
 *
 * If the client gets back a fraction of what they paid, the creator returns
 * the same fraction of what they received. A full refund always returns the
 * whole payout, so rounding can never leave a cent behind.
 */
export function reversalShareCents({ payoutCents, chargedCents, refundedTotalCents }) {
  if (payoutCents <= 0 || chargedCents <= 0 || refundedTotalCents <= 0) return 0;
  if (refundedTotalCents >= chargedCents) return payoutCents;
  return Math.min(payoutCents, Math.round((payoutCents * refundedTotalCents) / chargedCents));
}

/** $450 for whole dollars, $450.50 once there are cents. */
export function money(amount) {
  const value = Number(amount || 0);
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function moneyFromCents(cents) {
  return money(fromCents(cents));
}
