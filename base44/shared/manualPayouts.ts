import { secrets } from 'base44:runtime';
import { money, stripeGet, stripePost, toCents } from './stripe.ts';
import { sendEmail } from './notify.ts';
import { resolveCreatorOwner } from './creatorOwner.ts';

const PUBLISHED_ORIGIN = 'https://getstelli.com';

/** Guards against a typo like 5000 instead of 50. */
export const MANUAL_PAYOUT_MAX = 2000;

/**
 * Founder-initiated payouts: any amount, to any creator, with no booking or
 * contract behind them.
 *
 * The money comes out of Stelli's available Stripe balance. If the creator has
 * not finished payout setup — or the balance has not cleared yet — the payout
 * simply waits as "waiting" and goes out on its own later: the moment the
 * creator finishes setup, and on every hourly sweep.
 */
export async function sendManualPayout(base44, payout, { notify = true } = {}) {
  if (!payout || payout.status === 'sent' || payout.stripe_transfer_id) {
    return { sent: false, reason: 'already-sent' };
  }

  const lensman = await base44.asServiceRole.entities.Lensman.get(payout.lensman_id).catch(() => null);
  if (!lensman) {
    await base44.asServiceRole.entities.ManualPayout.update(payout.id, {
      status: 'failed',
      waiting_reason: 'Creator profile no longer exists.',
    });
    return { sent: false, reason: 'no-creator' };
  }

  const { ownerEmail } = await resolveCreatorOwner(base44, lensman);
  const amount = Number(payout.amount || 0);

  // No payout account yet: the money stays on Stelli's balance until they set one up.
  if (!lensman.stripe_account_id || !lensman.payouts_enabled) {
    const firstNotice = payout.waiting_reason !== 'Creator has not finished payout setup.';
    await base44.asServiceRole.entities.ManualPayout.update(payout.id, {
      status: 'waiting',
      waiting_reason: 'Creator has not finished payout setup.',
    });
    if (notify && firstNotice) {
      await sendEmail(
        base44,
        ownerEmail,
        'You have money waiting on Stelli.',
        `Stelli sent you ${money(amount)}. Set up payouts whenever you're ready and it will go straight to your bank.\n\n${PUBLISHED_ORIGIN}/lensman-dashboard`
      );
    }
    return { sent: false, reason: 'no-payout-account' };
  }

  const transferGroup = `manual_payout_${payout.id}`;

  // If an earlier attempt reached Stripe but we never heard back, record that
  // transfer instead of sending a second one.
  try {
    const existing = await stripeGet(`transfers?transfer_group=${transferGroup}&limit=1`);
    const found = existing?.data?.[0];
    if (found) {
      await markSent(base44, payout, found.id);
      return { sent: true, transferId: found.id, amount };
    }
  } catch (error) {
    console.error('Could not check earlier transfers for', payout.id, '-', error.message);
    return { sent: false, reason: 'stripe-unreachable' };
  }

  const attempts = Number(payout.attempts || 0) + 1;
  const params = new URLSearchParams();
  params.set('amount', String(toCents(amount)));
  params.set('currency', 'usd');
  params.set('destination', lensman.stripe_account_id);
  params.set('transfer_group', transferGroup);
  params.set('description', payout.note ? `Stelli payout: ${payout.note}` : 'Stelli payout');
  params.set('metadata[manual_payout_id]', payout.id);
  params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

  let transfer;
  try {
    transfer = await stripePost('transfers', params, `manual-payout-${payout.id}-${attempts}`);
  } catch (error) {
    const insufficient = /insufficient/i.test(error.message);
    await base44.asServiceRole.entities.ManualPayout.update(payout.id, {
      status: 'waiting',
      attempts,
      waiting_reason: insufficient
        ? "Stelli's Stripe balance doesn't have enough available funds yet. It retries every hour."
        : `Stripe said: ${error.message}`,
    });
    return { sent: false, reason: error.message };
  }

  await markSent(base44, payout, transfer.id, attempts);

  if (notify) {
    await sendEmail(
      base44,
      ownerEmail,
      'You got paid.',
      `${money(amount)} from Stelli is on its way to your bank.${payout.note ? `\n\n${payout.note}` : ''}`
    );
  }

  return { sent: true, transferId: transfer.id, amount };
}

async function markSent(base44, payout, transferId, attempts) {
  await base44.asServiceRole.entities.ManualPayout.update(payout.id, {
    status: 'sent',
    stripe_transfer_id: transferId,
    sent_at: new Date().toISOString(),
    waiting_reason: '',
    ...(attempts ? { attempts } : {}),
  });
}

/** Everything waiting for one creator — run the moment they can be paid. */
export async function sendWaitingManualPayouts(base44, lensman) {
  if (!lensman?.id || !lensman?.payouts_enabled) return { sent: 0 };
  const waiting = await base44.asServiceRole.entities.ManualPayout.filter({
    lensman_id: lensman.id,
    status: 'waiting',
  });
  let sent = 0;
  for (const payout of waiting) {
    try {
      const result = await sendManualPayout(base44, payout);
      if (result.sent) sent += 1;
    } catch (error) {
      console.error('Manual payout failed for', payout.id, '-', error.message);
    }
  }
  return { sent };
}

/** The hourly retry: every waiting payout whose creator can now be paid. */
export async function sweepManualPayouts(base44) {
  const waiting = await base44.asServiceRole.entities.ManualPayout.filter({ status: 'waiting' });
  let sent = 0;
  for (const payout of waiting) {
    try {
      // Quiet on the "still waiting for setup" case — they were told once already.
      const result = await sendManualPayout(base44, payout);
      if (result.sent) sent += 1;
    } catch (error) {
      console.error('Manual payout sweep failed for', payout.id, '-', error.message);
    }
  }
  return { checked: waiting.length, sent };
}
