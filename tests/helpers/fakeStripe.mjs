/**
 * A stand-in for the parts of Stripe's API the backend calls, installed over
 * global fetch. It is strict about the things the real fixes lean on:
 *
 *  - an idempotency key returns the first response again and does nothing new;
 *  - a refund can't exceed what is left on the charge;
 *  - a reversal can't exceed what is left on the transfer;
 *  - any call can be made to fail on demand, to test what happens next.
 *
 * `calls` is a log of every request, so a test can assert that a transfer was
 * (or was not) attempted.
 */
export function installFakeStripe({ livemode = true } = {}) {
  let n = 1;
  const id = (prefix) => `${prefix}_${n++}`;

  const state = {
    livemode,
    calls: [],
    sessions: new Map(),
    intents: new Map(),
    charges: new Map(),
    transfers: new Map(),
    refunds: [],
    reversals: [],
    idempotent: new Map(),
    /** path prefix -> error message; the next matching POST fails once per entry. */
    failNext: [],
  };

  const ok = (body) => new Response(JSON.stringify(body), { status: 200 });
  const fail = (message, status = 400) =>
    new Response(JSON.stringify({ error: { message } }), { status });

  function shouldFail(method, path) {
    const index = state.failNext.findIndex((f) => f.method === method && path.startsWith(f.path));
    if (index === -1) return null;
    const [rule] = state.failNext.splice(index, 1);
    return rule;
  }

  async function handle(url, init = {}) {
    const method = (init.method || 'GET').toUpperCase();
    const { pathname, searchParams } = new URL(url);
    const path = pathname.replace(/^\/v1\//, '');
    const params = init.body instanceof URLSearchParams ? init.body : new URLSearchParams(init.body || '');
    const key = init.headers?.['Idempotency-Key'];
    state.calls.push({ method, path, params: Object.fromEntries(params), key });

    if (method === 'POST' && key && state.idempotent.has(key)) {
      const saved = state.idempotent.get(key);
      return saved.error ? fail(saved.error, saved.status) : ok(saved.body);
    }
    const remember = (body) => {
      if (key) state.idempotent.set(key, { body });
      return ok(body);
    };
    const rememberFailure = (message, status = 400) => {
      if (key) state.idempotent.set(key, { error: message, status });
      return fail(message, status);
    };

    const forced = shouldFail(method, path);
    if (forced) return rememberFailure(forced.message, forced.status);

    // ---- Checkout sessions
    if (method === 'POST' && path === 'checkout/sessions') {
      let subtotal = 0;
      for (const [k, v] of params) if (/unit_amount\]$/.test(k)) subtotal += Number(v);
      const metadata = {};
      for (const [k, v] of params) {
        const m = /^metadata\[(.+)\]$/.exec(k);
        if (m) metadata[m[1]] = v;
      }
      const session = {
        id: id(state.livemode ? 'cs_live' : 'cs_test'),
        status: 'open',
        payment_status: 'unpaid',
        livemode: state.livemode,
        url: `https://checkout.stripe.test/${n}`,
        amount_subtotal: subtotal,
        amount_total: subtotal,
        total_details: { amount_tax: 0 },
        metadata,
        payment_intent: null,
      };
      state.sessions.set(session.id, session);
      return remember(session);
    }
    let m = /^checkout\/sessions\/([^/]+)\/expire$/.exec(path);
    if (method === 'POST' && m) {
      const session = state.sessions.get(m[1]);
      if (!session) return fail('No such checkout.session');
      if (session.status !== 'open') return fail('Only open sessions can be expired');
      session.status = 'expired';
      return ok(session);
    }
    m = /^checkout\/sessions\/([^/]+)$/.exec(path);
    if (method === 'GET' && m) {
      const session = state.sessions.get(m[1]);
      return session ? ok(session) : fail('No such checkout.session', 404);
    }

    // ---- Payment intents and charges
    m = /^payment_intents\/([^/]+)$/.exec(path);
    if (method === 'GET' && m) {
      const intent = state.intents.get(m[1]);
      return intent ? ok(intent) : fail('No such payment_intent', 404);
    }
    m = /^charges\/([^/]+)$/.exec(path);
    if (method === 'GET' && m) {
      const charge = state.charges.get(m[1]);
      return charge ? ok(charge) : fail('No such charge', 404);
    }

    // ---- Transfers
    if (method === 'POST' && path === 'transfers') {
      const transfer = {
        id: id('tr'),
        amount: Number(params.get('amount')),
        amount_reversed: 0,
        reversed: false,
        destination: params.get('destination'),
        transfer_group: params.get('transfer_group'),
        source_transaction: params.get('source_transaction'),
        metadata: { booking_id: params.get('metadata[booking_id]') },
      };
      state.transfers.set(transfer.id, transfer);
      return remember(transfer);
    }
    if (method === 'GET' && path === 'transfers') {
      const group = searchParams.get('transfer_group');
      return ok({ data: [...state.transfers.values()].filter((t) => t.transfer_group === group) });
    }
    m = /^transfers\/([^/]+)$/.exec(path);
    if (method === 'GET' && m) {
      const transfer = state.transfers.get(m[1]);
      return transfer ? ok(transfer) : fail('No such transfer', 404);
    }
    m = /^transfers\/([^/]+)\/reversals$/.exec(path);
    if (method === 'POST' && m) {
      const transfer = state.transfers.get(m[1]);
      if (!transfer) return fail('No such transfer');
      const amount = Number(params.get('amount'));
      if (amount > transfer.amount - transfer.amount_reversed) {
        return rememberFailure('Reversal amount is greater than the unreversed amount of the transfer');
      }
      transfer.amount_reversed += amount;
      transfer.reversed = transfer.amount_reversed >= transfer.amount;
      const reversal = { id: id('trr'), amount, transfer: transfer.id };
      state.reversals.push(reversal);
      return remember(reversal);
    }

    // ---- Refunds
    if (method === 'POST' && path === 'refunds') {
      const intent = state.intents.get(params.get('payment_intent'));
      const charge = intent
        ? state.charges.get(intent.latest_charge)
        : state.charges.get(params.get('charge'));
      if (!charge) return fail('No such charge');
      // No amount means "everything that is left", as at Stripe.
      const amount = params.has('amount') ? Number(params.get('amount')) : charge.amount - charge.amount_refunded;
      if (amount <= 0) return rememberFailure('Charge has already been refunded.');
      if (amount > charge.amount - charge.amount_refunded) {
        return rememberFailure('Refund amount is greater than the unrefunded amount on the charge');
      }
      charge.amount_refunded += amount;
      charge.refunded = charge.amount_refunded >= charge.amount;
      const refund = { id: id('re'), amount, charge: charge.id };
      state.refunds.push(refund);
      return remember(refund);
    }

    return fail(`fakeStripe: no handler for ${method} ${path}`, 500);
  }

  globalThis.fetch = async (url, init) => {
    if (!String(url).startsWith('https://api.stripe.com/')) {
      throw new Error(`Unexpected network call in a test: ${url}`);
    }
    return handle(String(url), init);
  };

  return {
    ...state,
    state,
    /** The client pays an open session by card: creates the intent and charge. */
    pay(sessionId, { tax = 0 } = {}) {
      const session = state.sessions.get(sessionId);
      const charge = {
        id: id('ch'),
        amount: session.amount_subtotal + tax,
        amount_refunded: 0,
        refunded: false,
        livemode: session.livemode,
      };
      const intent = { id: id('pi'), latest_charge: charge.id, status: 'succeeded' };
      charge.payment_intent = intent.id;
      state.charges.set(charge.id, charge);
      state.intents.set(intent.id, intent);
      Object.assign(session, {
        status: 'complete',
        payment_status: 'paid',
        payment_intent: intent.id,
        amount_total: session.amount_subtotal + tax,
        total_details: { amount_tax: tax },
      });
      return session;
    },
    /** The client pays by bank debit: the session completes but the money has not cleared. */
    payByBank(sessionId) {
      const session = this.pay(sessionId);
      session.payment_status = 'unpaid';
      state.intents.get(session.payment_intent).status = 'processing';
      return session;
    },
    /** The bank debit bounces. */
    bankFails(sessionId) {
      const session = state.sessions.get(sessionId);
      state.intents.get(session.payment_intent).status = 'requires_payment_method';
      return session;
    },
    /** The bank debit clears. */
    bankClears(sessionId) {
      const session = state.sessions.get(sessionId);
      session.payment_status = 'paid';
      state.intents.get(session.payment_intent).status = 'succeeded';
      return session;
    },
    /** status 400 is a definite refusal; 500 is "may or may not have happened". */
    failNextPost(path, message, status = 400) {
      state.failNext.push({ method: 'POST', path, message, status });
    },
    failNextGet(path, message, status = 400) {
      state.failNext.push({ method: 'GET', path, message, status });
    },
    count(method, pathPrefix) {
      return state.calls.filter((c) => c.method === method && c.path.startsWith(pathPrefix)).length;
    },
  };
}
