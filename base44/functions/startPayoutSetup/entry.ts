import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { stripeGet, stripePost, stripeV2Post } from '../../shared/stripe.ts';
import { releaseWaitingPayouts } from '../../shared/payouts.ts';
import { loadCreatorContact } from '../../shared/creatorOwner.ts';
import { safeOrigin } from '../../shared/origins.ts';

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

      const individual = {};
      if (first) individual.given_name = first;
      if (last) individual.surname = last;
      if (contact?.phone) individual.phone = contact.phone;

      // New connected accounts are created with Accounts v2, which is what
      // Stripe now expects from Connect platforms.
      const account = await stripeV2Post('core/accounts', {
        // Everything Stelli already knows, so they type as little as possible.
        contact_email: contact?.email || user.email || '',
        display_name: contact?.full_name || lensman.display_name || '',
        identity: {
          country: 'us',
          entity_type: 'individual',
          ...(Object.keys(individual).length ? { individual } : {}),
        },
        // Creators never take payments themselves, so transfers is all they need.
        configuration: {
          recipient: {
            capabilities: { stripe_balance: { stripe_transfers: { requested: true } } },
          },
        },
        // Stelli carries the fees and the losses; a creator is only ever paid.
        defaults: {
          responsibilities: { fees_collector: 'application', losses_collector: 'application' },
        },
        // The Express dashboard is where they manage their own bank and tax details.
        dashboard: 'express',
        metadata: {
          base44_app_id: secrets.get('BASE44_APP_ID') || '',
          lensman_id: lensman.id,
        },
      });

      accountId = account.id;

      await base44.asServiceRole.entities.Lensman.update(lensman.id, {
        stripe_account_id: accountId,
      });
    }

    const link = await stripeV2Post('core/account_links', {
      account: accountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['recipient'],
          refresh_url: `${base}/lensman-dashboard?payouts=refresh`,
          return_url: `${base}/lensman-dashboard?payouts=done`,
        },
      },
    });

    return Response.json({ url: link.url, accountId });
  } catch (error) {
    console.error('startPayoutSetup error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}