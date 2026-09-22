import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { stripeKey, stripePost } from '../../shared/stripe.ts';

const PUBLISHED_ORIGIN = 'https://getstelli.base44.app';

/**
 * Payout setup, run the first time a creator tries to quote. Their Stripe
 * account receives the payout once a booking's hold is released.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { origin, action } = await req.json();
    const base = (origin || PUBLISHED_ORIGIN).replace(/\/$/, '');

    const profiles = await base44.asServiceRole.entities.Lensman.filter({ user_id: user.id });
    const lensman = profiles[0];
    if (!lensman) return Response.json({ error: 'No creator profile found.' }, { status: 404 });

    // Ask Stripe directly whether onboarding finished.
    if (action === 'status' && lensman.stripe_account_id) {
      const response = await fetch(
        `https://api.stripe.com/v1/accounts/${lensman.stripe_account_id}`,
        { headers: { Authorization: `Bearer ${stripeKey()}`, 'Stripe-Version': '2025-10-29.clover' } }
      );
      const account = await response.json();
      const enabled = Boolean(account?.payouts_enabled);
      if (enabled !== Boolean(lensman.payouts_enabled)) {
        await base44.asServiceRole.entities.Lensman.update(lensman.id, {
          payouts_enabled: enabled,
          payouts_onboarded_at: enabled ? new Date().toISOString() : lensman.payouts_onboarded_at,
        });
      }
      return Response.json({ payoutsEnabled: enabled });
    }

    let accountId = lensman.stripe_account_id;

    if (!accountId) {
      const params = new URLSearchParams();
      params.set('type', 'express');
      params.set('email', lensman.email || user.email);
      params.set('capabilities[transfers][requested]', 'true');
      params.set('metadata[base44_app_id]', '');
      params.set('metadata[lensman_id]', lensman.id);

      const account = await stripePost('accounts', params, `connect-${lensman.id}`);
      accountId = account.id;

      await base44.asServiceRole.entities.Lensman.update(lensman.id, {
        stripe_account_id: accountId,
      });
    }

    const linkParams = new URLSearchParams();
    linkParams.set('account', accountId);
    linkParams.set('type', 'account_onboarding');
    linkParams.set('refresh_url', `${base}/lensman-dashboard?payouts=refresh`);
    linkParams.set('return_url', `${base}/lensman-dashboard?payouts=done`);

    const link = await stripePost('account_links', linkParams);

    return Response.json({ url: link.url, accountId });
  } catch (error) {
    console.error('startPayoutSetup error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}