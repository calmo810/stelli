import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { stripePost, toCents } from '../../shared/stripe.ts';
import { safeOrigin } from '../../shared/origins.ts';
import { logAdminAction, requireAdmin } from '../../shared/audit.ts';
import { money } from '../../shared/money.ts';

const MAX_CHARGE = 5000;

/**
 * A founder taking a one-off payment outside the booking flow — a client
 * found in person, for example. It returns a Stripe payment page link: send it
 * to the client, or open it and enter a card yourself. The money lands on
 * Stelli's Stripe balance like every other payment.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await requireAdmin(base44);
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { amount, description, customerEmail, origin } = await req.json();
    const value = Math.round(Number(amount) * 100) / 100;

    if (!Number.isFinite(value) || value < 1) {
      return Response.json({ error: 'The amount must be at least $1.' }, { status: 400 });
    }
    if (value > MAX_CHARGE) {
      return Response.json(
        { error: `The most you can charge in one link is $${MAX_CHARGE}.` },
        { status: 400 }
      );
    }

    const label = String(description || '').trim().slice(0, 300) || 'Stelli photo session';
    const email = String(customerEmail || '').trim();
    const base = safeOrigin(origin);
    const appId = secrets.get('BASE44_APP_ID') || '';

    const charge = await base44.asServiceRole.entities.OneOffCharge.create({
      amount: value,
      description: label,
      customer_email: email,
      status: 'open',
      created_by_email: user.email,
    });

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    // The payer may be a client, so they come back to the public home page.
    body.set('success_url', `${base}/?payment=success`);
    body.set('cancel_url', `${base}/?payment=cancelled`);
    if (email) body.set('customer_email', email);
    body.set('line_items[0][quantity]', '1');
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][unit_amount]', String(toCents(value)));
    body.set('line_items[0][price_data][product_data][name]', label);
    body.set('invoice_creation[enabled]', 'true');
    body.set('metadata[base44_app_id]', appId);
    body.set('metadata[one_off_charge_id]', charge.id);
    body.set('payment_intent_data[metadata][base44_app_id]', appId);
    body.set('payment_intent_data[metadata][one_off_charge_id]', charge.id);

    const session = await stripePost('checkout/sessions', body, `one-off-charge-${charge.id}`);

    await base44.asServiceRole.entities.OneOffCharge.update(charge.id, {
      checkout_url: session.url,
      stripe_checkout_session_id: session.id,
    });

    await logAdminAction(base44, user, {
      action: 'one_off_charge',
      summary: `Created a ${money(value)} payment link: ${label}${email ? ` (for ${email})` : ''}.`,
      amount: value,
      details: { chargeId: charge.id, sessionId: session.id },
    });

    return Response.json({ chargeId: charge.id, url: session.url });
  } catch (error) {
    console.error('createOneOffCharge error:', error.message);
    return Response.json({ error: 'The payment link could not be created. Try again.' }, { status: 500 });
  }
}
