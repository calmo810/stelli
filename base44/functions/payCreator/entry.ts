import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { MANUAL_PAYOUT_MAX, sendManualPayout } from '../../shared/manualPayouts.ts';

/**
 * A founder paying a creator directly: any amount, no booking or contract.
 * The payout goes out right away if the creator can be paid; otherwise it
 * waits on Stelli's balance until they finish payout setup.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { lensmanId, amount, note } = await req.json();
    const value = Math.round(Number(amount) * 100) / 100;

    if (!lensmanId) {
      return Response.json({ error: 'Pick a creator to pay.' }, { status: 400 });
    }
    if (!Number.isFinite(value) || value < 1) {
      return Response.json({ error: 'The amount must be at least $1.' }, { status: 400 });
    }
    if (value > MANUAL_PAYOUT_MAX) {
      return Response.json(
        { error: `The most you can send in one payout is $${MANUAL_PAYOUT_MAX}.` },
        { status: 400 }
      );
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId).catch(() => null);
    if (!lensman) return Response.json({ error: 'Creator not found.' }, { status: 404 });

    const payout = await base44.asServiceRole.entities.ManualPayout.create({
      lensman_id: lensman.id,
      creator_user_id: lensman.user_id || '',
      lensman_name: lensman.display_name || 'Stelli creator',
      amount: value,
      note: String(note || '').slice(0, 500),
      status: 'waiting',
      attempts: 0,
      paid_by_email: user.email,
    });

    const result = await sendManualPayout(base44, payout);
    return Response.json({ payoutId: payout.id, ...result });
  } catch (error) {
    console.error('payCreator error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
