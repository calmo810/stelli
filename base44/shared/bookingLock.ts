/**
 * One thing at a time may move a booking's money.
 *
 * A payout, a refund, a cancellation and a problem report all used to read the
 * booking, decide, and act — each on its own copy. Two of them at the same
 * moment could both decide "go": the hourly sweep paying a creator one second
 * after the client reported a problem, for instance.
 *
 * Now each of them first has to claim the booking. The claim is a single
 * conditional write — "set payout_lock to my token, but only if it is empty" —
 * which the database applies to one caller and refuses to the rest. The winner
 * then re-reads the booking and decides on what it actually says now; the
 * loser stops (or waits its turn).
 *
 * A claim is confirmed by reading the token back, so nothing here depends on
 * what the write call happens to return.
 */

/** A lock left by a run that died is taken over after this long. */
const STALE_AFTER_MS = 10 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function tryClaim(base44, bookingId, kind) {
  const Booking = base44.asServiceRole.entities.Booking;
  const token = `${kind}:${crypto.randomUUID()}`;
  const stamp = new Date().toISOString();

  // Only an unclaimed booking matches. Missing, null and '' all count as unclaimed.
  await Booking.updateMany(
    { id: bookingId, payout_lock: { $in: [null, ''] } },
    { $set: { payout_lock: token, payout_lock_at: stamp } }
  ).catch((error) => console.error('Lock write failed for booking', bookingId, '-', error.message));

  let booking = await Booking.get(bookingId).catch(() => null);
  if (!booking) return { won: false, reason: 'not-found', booking: null };
  if (booking.payout_lock === token) return { won: true, token, booking };

  // Nobody holds it, yet the conditional write did not land: the database
  // did not treat the missing field as empty. Give the field a value (only
  // ever '' — this never takes or breaks anyone's lock) and try once more.
  if (booking.payout_lock === undefined || booking.payout_lock === null) {
    await Booking.updateMany(
      { id: bookingId, payout_lock: { $exists: false } },
      { $set: { payout_lock: '' } }
    ).catch(() => {});
    await Booking.updateMany(
      { id: bookingId, payout_lock: '' },
      { $set: { payout_lock: token, payout_lock_at: stamp } }
    ).catch((error) => console.error('Lock write failed for booking', bookingId, '-', error.message));
    booking = await Booking.get(bookingId).catch(() => null);
    if (booking?.payout_lock === token) return { won: true, token, booking };
    if (!booking) return { won: false, reason: 'not-found', booking: null };
  }

  // Whoever held it never let go (a crash, a timeout). Take it over — again
  // with a conditional write, so only one caller can inherit a dead lock.
  const heldSince = booking.payout_lock_at ? new Date(booking.payout_lock_at).getTime() : 0;
  if (booking.payout_lock && Date.now() - heldSince > STALE_AFTER_MS) {
    await Booking.updateMany(
      { id: bookingId, payout_lock: booking.payout_lock },
      { $set: { payout_lock: token, payout_lock_at: stamp } }
    ).catch((error) => console.error('Lock takeover failed for booking', bookingId, '-', error.message));

    booking = await Booking.get(bookingId).catch(() => null);
    if (booking?.payout_lock === token) return { won: true, token, booking, tookOver: true };
  }

  return { won: false, reason: 'busy', booking };
}

/**
 * Claims a booking. With `waitMs`, keeps trying for that long — used by the
 * problem report, which should queue behind a payout in flight, not give up.
 */
export async function claimBooking(base44, bookingId, kind, { waitMs = 0 } = {}) {
  const deadline = Date.now() + waitMs;
  let claim = await tryClaim(base44, bookingId, kind);
  while (!claim.won && claim.reason === 'busy' && Date.now() < deadline) {
    await sleep(400);
    claim = await tryClaim(base44, bookingId, kind);
  }
  return claim;
}

/** Lets go — but only of a lock this caller still holds. */
export async function unlockBooking(base44, bookingId, token) {
  if (!token) return;
  await base44.asServiceRole.entities.Booking.updateMany(
    { id: bookingId, payout_lock: token },
    { $set: { payout_lock: '' } }
  ).catch((error) => console.error('Unlock failed for booking', bookingId, '-', error.message));
}

/**
 * Runs `work` with the booking claimed and freshly read, and always lets go
 * afterwards. Returns { locked: false, reason } if the booking could not be
 * claimed, otherwise { locked: true, result }.
 */
export async function withBookingLock(base44, bookingId, kind, work, options = {}) {
  if (!bookingId) return { locked: false, reason: 'not-found' };
  const claim = await claimBooking(base44, bookingId, kind, options);
  if (!claim.won) return { locked: false, reason: claim.reason, booking: claim.booking };
  try {
    return { locked: true, result: await work(claim.booking) };
  } finally {
    await unlockBooking(base44, bookingId, claim.token);
  }
}
