import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import ConfirmAction, { newActionId } from '@/components/shared/ConfirmAction';

const SURFACE = { background: 'hsl(var(--surface))', borderRadius: 4 };
const CARD = 'border border-white/10';
const FIELD =
  'w-full bg-transparent border border-white/15 px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/40';
const LABEL = 'label-mono text-[9px] text-white/45 mb-2 block';
const LIME_BUTTON = { background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 };

/** The usual flat fee per shoot while Stelli is getting started. */
const DEFAULT_PAYOUT = 50;

function money(amount) {
  const value = Number(amount || 0);
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function when(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatusPill({ status }) {
  const tone = { sent: 'lime', paid: 'lime', waiting: 'cyan', open: 'cyan', processing: 'cyan' }[status] || 'magenta';
  return (
    <span
      className="label-mono text-[8px] font-semibold px-2.5 py-1.5 shrink-0"
      style={{
        background: `hsl(var(--neon-${tone}) / 0.12)`,
        color: `hsl(var(--neon-${tone}))`,
        borderRadius: 3,
      }}
    >
      {status}
    </span>
  );
}

function errorText(error) {
  return error?.response?.data?.error || error?.message || 'Something went wrong. Try again.';
}

/** Pay any creator any amount, with no booking or contract behind it. */
export function PayCreatorPanel({ lensmen }) {
  const queryClient = useQueryClient();
  const [lensmanId, setLensmanId] = useState('');
  const [amount, setAmount] = useState(String(DEFAULT_PAYOUT));
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const { data: payouts = [] } = useQuery({
    queryKey: ['admin-manual-payouts'],
    queryFn: () => base44.entities.ManualPayout.list('-created_date', 100),
  });

  // One payout goes through three possible stops:
  //   confirm  — "Send $50 to Maya. This can't be undone."
  //   decide   — only if Maya has a booking Stelli is holding money for: is
  //              this payout for that booking, or separate money on top?
  //   confirm  — again, saying which.
  // `pending.requestId` stays the same from the first tap to the last, so the
  // server treats every send of this payout as the same one.
  const [pending, setPending] = useState(null); // { requestId, bookingId, confirmSeparate, text }
  const [decision, setDecision] = useState(null); // { message, heldBookings }
  const [confirmError, setConfirmError] = useState('');

  const lensman = lensmen.find((l) => l.id === lensmanId);
  const name = lensman?.display_name || 'the creator';

  const pay = useMutation({
    mutationFn: async (/** @type {{ bookingId?: string, confirmSeparate?: boolean, requestId?: string }} */ request) => {
      const response = await base44.functions.invoke('payCreator', {
        lensmanId,
        amount: Number(amount),
        note,
        requestId: request.requestId,
        bookingId: request.bookingId || undefined,
        confirmSeparate: Boolean(request.confirmSeparate),
      });
      if (response.data?.error) throw new Error(response.data.error);
      return response.data || {};
    },
    onSuccess: (data) => {
      if (data.needsDecision) {
        // Nothing was paid. Ask which it is.
        setDecision({ message: data.message, heldBookings: data.heldBookings || [] });
        setPending((prev) => (prev ? { ...prev, awaitingDecision: true } : prev));
        return;
      }
      setMessage(
        data.duplicate
          ? 'That payout was already sent. Nothing was sent twice.'
          : data.sent
            ? `${money(amount)} sent to ${name}.`
            : data.reason === 'no-payout-account'
              ? `${money(amount)} is held for ${name}. It goes out once they set up payouts — they've been emailed.`
              : `${money(amount)} is held for ${name} and will retry every hour.`
      );
      setPending(null);
      setDecision(null);
      setNote('');
      setAmount(String(DEFAULT_PAYOUT));
      queryClient.invalidateQueries({ queryKey: ['admin-manual-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    // The dialog stays open with the same request ID, so trying again is safe.
    onError: (error) => setConfirmError(errorText(error)),
  });

  const startPay = () => {
    setMessage('');
    setConfirmError('');
    setDecision(null);
    setPending({
      requestId: newActionId(),
      text: `Send ${money(amount)} to ${name} from Stelli’s Stripe balance. This can’t be undone.`,
    });
  };

  const choose = (booking) => {
    setConfirmError('');
    setPending((prev) => ({
      ...prev,
      awaitingDecision: false,
      bookingId: booking ? booking.id : '',
      confirmSeparate: !booking,
      text: booking
        ? `Send ${money(amount)} to ${name} as the payout for ${booking.client_name}’s ${booking.event_date} booking. The booking is marked paid, and the automatic payout of ${money(booking.creator_payout)} will not go out. This can’t be undone.`
        : `Send ${money(amount)} to ${name} on top of the booking payout they will still receive automatically. This can’t be undone.`,
    }));
    setDecision(null);
  };

  const cancelPay = () => {
    setPending(null);
    setDecision(null);
    setConfirmError('');
  };

  const valid = lensmanId && Number(amount) >= 1;
  const waitingTotal = payouts
    .filter((p) => p.status === 'waiting')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className={`${CARD} p-6`} style={SURFACE}>
        <h3 className="font-heading text-[20px] font-semibold text-white leading-tight mb-1">Pay a creator</h3>
        <p className="font-body text-[13px] text-white/45 mb-6">
          Comes out of Stelli's Stripe balance. No booking or contract needed. If they haven't set up payouts yet,
          it waits for them.
        </p>

        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div>
            <label className={LABEL} htmlFor="pay-creator">Creator</label>
            <select
              id="pay-creator"
              value={lensmanId}
              onChange={(e) => setLensmanId(e.target.value)}
              className={FIELD}
              style={{ background: 'hsl(var(--surface))' }}
            >
              <option value="">Choose a creator…</option>
              {lensmen.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.display_name || 'Stelli creator'}
                  {l.payouts_enabled ? '' : ' (payouts not set up)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="pay-amount">Amount (USD)</label>
            <input
              id="pay-amount"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={FIELD}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={LABEL} htmlFor="pay-note">Note (optional, the creator sees it)</label>
          <input
            id="pay-note"
            type="text"
            maxLength={500}
            placeholder="e.g. Senior pics, Nov 8"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={FIELD}
          />
        </div>

        {lensman && !lensman.payouts_enabled && (
          <p className="font-body text-[12px] text-white/45 mt-4">
            {lensman.display_name || 'This creator'} hasn't finished payout setup. The money stays on Stelli's balance
            until they do, then goes out automatically.
          </p>
        )}

        <Button
          onClick={startPay}
          disabled={!valid || pay.isPending || Boolean(pending)}
          className="mt-6 w-full label-mono text-[10px] font-semibold"
          style={LIME_BUTTON}
        >
          {pay.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ${money(amount || 0)}`}
        </Button>

        {decision && (
          <div className="mt-5 border border-neon-cyan/40 p-4" style={{ borderRadius: 4 }}>
            <p className="font-body text-[14px] leading-relaxed text-white/85">{decision.message}</p>
            <p className="mt-1 font-body text-[12px] text-white/45">Nothing has been sent yet.</p>
            <div className="mt-4 flex flex-col gap-2">
              {decision.heldBookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => choose(booking)}
                  className="min-h-[48px] border border-white/15 px-4 py-3 text-left font-body text-[14px] text-white/85 transition-colors hover:bg-white/5"
                  style={{ borderRadius: 4 }}
                >
                  It’s for {booking.client_name}’s {booking.event_date} booking
                  <span className="mt-0.5 block text-[12px] text-white/45">
                    Replaces the automatic payout of {money(booking.creator_payout)}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => choose(null)}
                className="min-h-[48px] border border-white/15 px-4 py-3 text-left font-body text-[14px] text-white/85 transition-colors hover:bg-white/5"
                style={{ borderRadius: 4 }}
              >
                It’s separate
                <span className="mt-0.5 block text-[12px] text-white/45">
                  Paid on top. The booking still pays out on its own.
                </span>
              </button>
              <button type="button" onClick={cancelPay} className="min-h-[44px] font-body text-[13px] text-white/50 hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        )}

        {message && <p role="status" className="font-body text-[13px] text-white/70 mt-4">{message}</p>}
      </div>

      <ConfirmAction
        open={Boolean(pending) && !pending.awaitingDecision}
        title={`Pay ${money(amount || 0)} to ${name}`}
        message={pending?.text || ''}
        confirmLabel="Yes, send it"
        busy={pay.isPending}
        error={confirmError}
        onConfirm={() => pending && pay.mutate(pending)}
        onCancel={cancelPay}
      />

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="label-mono text-[10px] text-white/45">Recent payouts</h4>
          {waitingTotal > 0 && (
            <span className="label-mono text-[9px] text-white/45">{money(waitingTotal)} waiting</span>
          )}
        </div>
        <div className="space-y-2">
          {payouts.length === 0 && (
            <p className="font-body text-[13px] text-white/35 py-8 text-center">No payouts yet.</p>
          )}
          {payouts.map((p) => (
            <div key={p.id} className={`${CARD} p-4 flex items-center justify-between gap-4`} style={SURFACE}>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-white">
                  {money(p.amount)} → {p.lensman_name}
                </p>
                <p className="label-mono text-[9px] text-white/40 mt-1.5 truncate">
                  {when(p.created_date)}
                  {p.note ? ` · ${p.note}` : ''}
                  {p.status === 'waiting' && p.waiting_reason ? ` · ${p.waiting_reason}` : ''}
                </p>
              </div>
              <StatusPill status={p.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Take a one-off payment: a Stripe payment link for any amount. */
export function OneOffChargePanel() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const { data: charges = [] } = useQuery({
    queryKey: ['admin-one-off-charges'],
    queryFn: () => base44.entities.OneOffCharge.list('-created_date', 100),
  });

  const create = useMutation({
    mutationFn: () =>
      base44.functions.invoke('createOneOffCharge', {
        amount: Number(amount),
        description,
        customerEmail,
        origin: window.location.origin,
      }),
    onSuccess: (response) => {
      setLink(response.data?.url || '');
      setCopied(false);
      queryClient.invalidateQueries({ queryKey: ['admin-one-off-charges'] });
    },
    onError: (e) => setError(errorText(e)),
  });

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const heldTotal = charges
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className={`${CARD} p-6`} style={SURFACE}>
        <h3 className="font-heading text-[20px] font-semibold text-white leading-tight mb-1">Take a one-off payment</h3>
        <p className="font-body text-[13px] text-white/45 mb-6">
          Makes a secure Stripe payment page. Text it to the client, or open it and enter a card yourself. The money
          lands on Stelli's Stripe balance.
        </p>

        <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <div>
            <label className={LABEL} htmlFor="charge-amount">Amount (USD)</label>
            <input
              id="charge-amount"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="charge-description">What it's for (the payer sees this)</label>
            <input
              id="charge-description"
              type="text"
              maxLength={300}
              placeholder="Stelli photo session"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={FIELD}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={LABEL} htmlFor="charge-email">Payer email (optional, for their receipt)</label>
          <input
            id="charge-email"
            type="email"
            placeholder="client@example.com"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className={FIELD}
          />
        </div>

        <Button
          onClick={() => {
            setError('');
            setLink('');
            create.mutate();
          }}
          disabled={!(Number(amount) >= 1) || create.isPending}
          className="mt-6 w-full label-mono text-[10px] font-semibold"
          style={LIME_BUTTON}
        >
          {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create payment link'}
        </Button>

        {error && (
          <p className="font-body text-[13px] mt-4" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>
        )}

        {link && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => copy(link)}
              variant="outline"
              className="flex-1 label-mono text-[10px] border-white/15 text-white/70 bg-transparent hover:bg-white/5 hover:text-white"
              style={{ borderRadius: 4 }}
            >
              <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button
              onClick={() => window.open(link, '_blank', 'noopener')}
              variant="outline"
              className="flex-1 label-mono text-[10px] border-white/15 text-white/70 bg-transparent hover:bg-white/5 hover:text-white"
              style={{ borderRadius: 4 }}
            >
              <ExternalLink className="w-4 h-4" /> Open and pay
            </Button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="label-mono text-[10px] text-white/45">Recent one-off payments</h4>
          {heldTotal > 0 && (
            <span className="label-mono text-[9px] text-white/45">{money(heldTotal)} collected</span>
          )}
        </div>
        <div className="space-y-2">
          {charges.length === 0 && (
            <p className="font-body text-[13px] text-white/35 py-8 text-center">No one-off payments yet.</p>
          )}
          {charges.map((c) => (
            <div key={c.id} className={`${CARD} p-4 flex items-center justify-between gap-4`} style={SURFACE}>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-white">
                  {money(c.amount)} · {c.description}
                </p>
                <p className="label-mono text-[9px] text-white/40 mt-1.5 truncate">
                  {when(c.created_date)}
                  {c.customer_email ? ` · ${c.customer_email}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.status === 'open' && c.checkout_url && (
                  <button
                    type="button"
                    onClick={() => copy(c.checkout_url)}
                    className="label-mono text-[9px] text-white/50 hover:text-white"
                  >
                    Copy link
                  </button>
                )}
                <StatusPill status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
