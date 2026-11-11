/**
 * Stripe gives every webhook endpoint its own signing secret. A Connect
 * endpoint (creator payout setup) and the platform endpoint (payments) are two
 * endpoints, so the webhook has to accept either secret.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { fn, scenario } from './helpers/scenario.mjs';

async function send(w, secret, type, object) {
  const payload = JSON.stringify({ id: `evt_${Math.random()}`, type, livemode: true, data: { object } });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  globalThis.__base44 = w.db;
  const handler = await fn('stripeWebhook');
  const response = await handler(
    new Request('https://stelli.test/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` },
      body: payload,
    })
  );
  return response.status;
}

test('account.updated signed by the Connect endpoint secret is accepted', async () => {
  const w = await scenario({ payoutsEnabled: false });
  await w.entities.Lensman.update('l1', { stripe_account_id: 'acct_maya' });
  globalThis.__secrets = { ...globalThis.__secrets, STRIPE_CONNECT_WEBHOOK_SECRET: 'whsec_connect' };

  const status = await send(w, 'whsec_connect', 'account.updated', {
    id: 'acct_maya',
    payouts_enabled: true,
    capabilities: { transfers: 'active' },
  });
  assert.equal(status, 200);
  assert.equal((await w.entities.Lensman.get('l1')).payouts_enabled, true);
});

test('an event signed with a secret that is not stored is refused', async () => {
  const w = await scenario({ payoutsEnabled: false });
  const status = await send(w, 'whsec_someone_else', 'account.updated', { id: 'acct_maya', payouts_enabled: true });
  assert.ok(status >= 400);
});
