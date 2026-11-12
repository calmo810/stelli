import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Lock, Clock } from 'lucide-react';
import { clientTotal, SERVICE_FEE_RATE } from '@/lib/threadPricing';
import Pill from '@/components/shared/Pill';

const dollars = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(Number(value || 0)) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

/** A creator's quote: one price, what it includes, one button. */
export default function QuoteCard({ quote, booking, role, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState([]);

  const expired = quote.status === 'sent' && quote.expires_at && new Date(quote.expires_at) < new Date();
  const replaced = quote.status === 'superseded';
  const dead = expired || replaced || ['declined', 'expired'].includes(quote.status);
  // The quote the client accepted and this booking is running on.
  // (Bookings accepted before quote_id existed have it blank.)
  const accepted = quote.status === 'accepted' && (!booking?.quote_id || booking.quote_id === quote.id);
  const payment = booking?.payment_status || 'pending';
  const cancelled = booking?.status === 'cancelled';
  const clearing = accepted && payment === 'processing';
  const paid = accepted && ['held', 'released', 'partially_refunded', 'refunded'].includes(payment);
  const underReview = Boolean(booking?.stray_payment_intent_id);
  const canAct = !dead && !paid && !clearing && !cancelled && !underReview && (quote.status === 'sent' || accepted);

  const offered = quote.add_ons || [];
  // Once accepted, the add-ons are the ones saved with the booking — the same
  // ones Checkout charges for. Before that, they are whatever is ticked here.
  const chosen = accepted
    ? booking?.picked_add_ons || []
    : offered.filter((addOn) => picked.includes(addOn.name));
  const price = Number(quote.amount || 0);
  const subtotal =
    Math.round((price + chosen.reduce((sum, a) => sum + (Number(a.price) || 0), 0)) * 100) / 100;
  const total = clientTotal(subtotal);
  const fee = Math.round((total - subtotal) * 100) / 100;

  const toggle = (name) =>
    setPicked((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  const acceptAndPay = async () => {
    // Stripe Checkout has to open as a top-level page. When the app is running in a
    // frame the tab is opened here, in the click itself, before anything is awaited —
    // a popup blocker would drop it otherwise.
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open('', '_blank') : null;
    if (isFramed && !checkoutTab) {
      setError('Allow popups to continue to checkout.');
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;

    setBusy(true);
    setError('');
    try {
      const acceptedQuote = await base44.functions.invoke('acceptQuote', {
        quoteId: quote.id,
        pickedAddOns: chosen.map((addOn) => ({ name: addOn.name })),
      });
      if (acceptedQuote.data?.error) {
        checkoutTab?.close();
        setError(acceptedQuote.data.error);
        onChanged?.();
        return;
      }
      const checkout = await base44.functions.invoke('createBookingCheckout', {
        bookingId: booking.id,
        origin: window.location.origin,
      });
      if (checkout.data?.url) {
        if (checkoutTab) {
          checkoutTab.location.replace(checkout.data.url);
        } else {
          window.location.assign(checkout.data.url);
        }
      } else {
        checkoutTab?.close();
        setError(checkout.data?.error || 'Payment could not be started.');
        onChanged?.();
      }
    } catch (e) {
      checkoutTab?.close();
      setError(e?.response?.data?.error || 'We could not start the payment. Please try again.');
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!window.confirm('Decline this quote? Your creator can send you another one.')) return;
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('declineQuote', { quoteId: quote.id });
      if (response.data?.error) throw new Error(response.data.error);
      onChanged?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'That did not go through. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-[26px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-white/40">QUOTE</p>
          <p className="mt-2 text-[38px] font-semibold leading-none text-white">{dollars(price)}</p>
          <p className="mt-2 text-[14px] text-white/55">{quote.included_edits || 30} edited photos</p>
        </div>
        {quote.expires_at && quote.status === 'sent' && !dead && (
          <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-white/40">
            <Clock className="h-3.5 w-3.5" />
            {new Date(quote.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Still choosing: the add-ons can be ticked. */}
      {role === 'client' && canAct && !accepted && offered.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-medium text-white/50">Add these on?</p>
          <div className="flex flex-wrap gap-2">
            {offered.map((addOn) => {
              const active = picked.includes(addOn.name);
              return (
                <button
                  key={addOn.name}
                  type="button"
                  onClick={() => toggle(addOn.name)}
                  aria-pressed={active}
                  className="min-h-[44px] rounded-[980px] border px-4 py-2.5 text-[14px] transition-colors"
                  style={{
                    borderColor: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.14)',
                    background: active ? 'hsl(var(--neon-lime) / 0.12)' : 'transparent',
                    color: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {addOn.name}
                  {addOn.price ? ` · +${dollars(addOn.price)}` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Accepted: the add-ons are settled, so they are shown, not offered. */}
      {accepted && chosen.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chosen.map((addOn) => (
            <span key={addOn.name} className="rounded-[980px] bg-white/[0.08] px-4 py-2 text-[14px] text-white/75">
              {addOn.name}
              {addOn.price ? ` · +${dollars(addOn.price)}` : ''}
            </span>
          ))}
        </div>
      )}

      {role !== 'client' && !accepted && offered.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {offered.map((addOn, i) => (
            <span
              key={i}
              className="rounded-[980px] bg-white/[0.08] px-4 py-2 text-[14px] text-white/65"
            >
              {addOn.name}
              {addOn.price ? ` · +${dollars(addOn.price)}` : ''}
            </span>
          ))}
        </div>
      )}

      {quote.message && (
        <p className="mt-4 rounded-2xl bg-white/[0.05] px-4 py-3 text-[15px] leading-relaxed text-white/70">
          {quote.message}
        </p>
      )}

      {role === 'client' && (
        <>
          {paid ? (
            <p className="mt-4 text-[13px] font-medium" style={{ color: 'hsl(var(--neon-lime))' }}>
              {payment === 'held'
                ? 'Paid. Your payment is held safely until your photos arrive.'
                : payment === 'refunded'
                  ? 'Refunded.'
                  : 'Paid.'}
            </p>
          ) : clearing ? (
            <p className="mt-4 text-[13px] text-white/60">
              Your bank payment is clearing. The date locks in once it does.
            </p>
          ) : replaced ? (
            <p className="mt-4 text-[13px] text-white/40">A newer quote replaced this one.</p>
          ) : dead ? (
            <p className="mt-4 text-[13px] text-white/40">
              {quote.status === 'declined' ? 'You declined this quote.' : 'This quote expired.'}
            </p>
          ) : cancelled ? (
            <p className="mt-4 text-[13px] text-white/40">This booking was cancelled.</p>
          ) : underReview ? (
            <p className="mt-4 text-[13px] text-white/60">
              A payment on this booking is being checked by a founder. Nothing more is needed from you.
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-4 text-[13px] text-white/45">
                <span>Service fee · {Math.round(SERVICE_FEE_RATE * 100)}%</span>
                <span className="text-white/70">{dollars(fee)}</span>
              </div>

              <Pill
                as="button"
                type="button"
                tone="lime"
                onClick={acceptAndPay}
                disabled={busy}
                className="mt-4 w-full py-4"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {accepted ? `Pay ${dollars(total)}` : `Accept & pay ${dollars(total)}`}
              </Pill>

              {!accepted && (
                <button
                  type="button"
                  onClick={decline}
                  disabled={busy}
                  className="mt-2 min-h-[44px] w-full text-[13px] text-white/45 transition-colors hover:text-white disabled:opacity-50"
                >
                  Not for me — decline this quote
                </button>
              )}

              <p className="mt-3 text-[12px] leading-relaxed text-white/40">
                {dollars(total)} total. Held safely by Stelli until your photos arrive. Paying accepts the{' '}
                {accepted && booking?.contract_id ? (
                  <Link to={`/agreements/${booking.contract_id}`} className="underline underline-offset-2 hover:text-white">
                    booking agreement
                  </Link>
                ) : (
                  'booking agreement'
                )}{' '}
                and Stelli’s{' '}
                <Link to="/terms" className="underline underline-offset-2 hover:text-white">
                  Terms
                </Link>
                .
              </p>
            </>
          )}
        </>
      )}

      {role === 'lensman' && (
        <p className="mt-4 text-[13px] text-white/40">
          {paid
            ? 'Paid. Held by Stelli until you deliver.'
            : clearing
              ? 'The client’s bank payment is clearing.'
              : replaced
                ? 'Replaced by a newer quote.'
                : quote.status === 'declined'
                  ? 'The client declined this quote.'
                  : dead
                    ? 'This quote expired.'
                    : accepted
                      ? 'Accepted. Waiting on payment.'
                      : 'Waiting on the client.'}
        </p>
      )}

      {error && (
        <p className="mt-3 text-[13px]" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {error}
        </p>
      )}
    </div>
  );
}
