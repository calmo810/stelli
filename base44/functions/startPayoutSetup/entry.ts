import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { stripeGet, stripePost } from '../../shared/stripe.ts';
import { releaseWaitingPayouts } from '../../shared/payouts.ts';
import { loadCreatorContact } from '../../shared/creatorOwner.ts';
import { safeOrigin } from '../../shared/origins.ts';

const PUBLISHED_ORIGIN = 'https://getstelli.base44.app';

/** Stripe's merchant category code for photography studios. */
const PHOTOGRAPHY_MCC = '7221';

const PRODUCT_DESCRIPTION = 'Photography and videography booked through Stelli.';

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/**
 * Creator payouts, all through one function:
 *  - no action     → create the Connect account if needed and send them to Stripe
 *  - action status → ask Stripe where they stand, and pay out anything waiting
 *  - action dashboard → an Express login link so they can manage their own bank
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { origin, action } = await req.json();
    const base = safeOrigin(origin);

    // The profile is found by the account that owns it — never created_by.
    const profiles = await base44.asServiceRole.entities.Lensman.filter({ user_id: user.id });
    const lensman = profiles[0];
    if (!lensman) return Response.json({ error: 'No creator profile found.' }, { status: 404 });

    if (action === 'status' && lensman.stripe_account_id) {
      const account = await stripeGet(`accounts/${lensman.stripe_account_id}`);
      const requirements = account?.requirements || {};

      // Creators only ever receive transfers, so charges_enabled is never checked.
      const enabled =
        account?.capabilities?.transfers === 'active' && Boolean(account?.payouts_enabled);

      const needsInfo =
        !account?.details_submitted ||
        (requirements.currently_due || []).length > 0 ||
        (requirements.past_due || []).length > 0;

      if (enabled !== Boolean(lensman.payouts_enabled)) {
        await base44.asServiceRole.entities.Lensman.update(lensman.id, {
          payouts_enabled: enabled,
          payouts_onboarded_at: enabled ? new Date().toISOString() : lensman.payouts_onboarded_at,
        });
      }

      // Anything held back for this creator goes out the moment they can be paid.
      let paidOut = 0;
      if (enabled) {
        const sweep = await releaseWaitingPayouts(base44, { ...lensman, payouts_enabled: true });
        paidOut = sweep.released;
      }

      return Response.json({ started: true, payoutsEnabled: enabled, needsInfo, paidOut });
    }

    // The Express dashboard is where a creator manages their own bank and tax
    // details — Stelli never stores any of it.
    if (action === 'dashboard') {
      if (!lensman.stripe_account_id || !lensman.payouts_enabled) {
        return Response.json({ error: 'Payouts are not active yet.' }, { status: 400 });
      }
      const link = await stripePost(
        `accounts/${lensman.stripe_account_id}/login_links`,
        new URLSearchParams()
      );
      return Response.json({ url: link.url });
    }

    let accountId = lensman.stripe_account_id;

    // Real name, email and phone are private, so they come from the
    // CreatorContact record with full privileges.
    const contact = await loadCreatorContact(base44, lensman.id);

    if (!accountId) {
      const { first, last } = splitName(contact?.full_name);
      const params = new URLSearchParams();
      params.set('type', 'express');
      params.set('country', 'US');
      params.set('business_type', 'individual');
      // Creators never take payments themselves, so transfers is all they need.
      params.set('capabilities[transfers][requested]', 'true');
      // Everything Stelli already knows, so they type as little as possible.
      params.set('email', contact?.email || user.email || '');
      if (first) params.set('individual[first_name]', first);
      if (last) params.set('individual[last_name]', last);
      if (contact?.phone) params.set('individual[phone]', contact.phone);
      params.set('business_profile[url]', `${PUBLISHED_ORIGIN}/creators/${lensman.slug || lensman.id}`);
      params.set('business_profile[mcc]', PHOTOGRAPHY_MCC);
      params.set('business_profile[product_description]', PRODUCT_DESCRIPTION);
      params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');
      params.set('metadata[lensman_id]', lensman.id);

      // No idempotency key here: the saved stripe_account_id is what prevents a
      // second account, and a fixed key would reject any later parameter change.
      const account = await stripePost('accounts', params);
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