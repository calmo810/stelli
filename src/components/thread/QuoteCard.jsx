import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Lock, Clock } from 'lucide-react';
import { clientTotal, SERVICE_FEE_RATE } from '@/lib/threadPricing';
import Pill from '@/components/shared/Pill';

/** A creator's quote: one price, what it includes, one button. */
export default function QuoteCard({ quote, booking, role, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Coming back to an accepted quote, the picker starts from what was already
  // chosen, so the total shown is the total that will be charged.
  const [picked, setPicked] = useState(() =>
    quote.status === 'accepted' && booking?.quote_id === quote.id
      ? (booking.picked_add_ons || []).map((addOn) => addOn.name)
      : []
  );

  const expired = quote.expires_at && new Date(quote.expires_at) < new Date();
  const dead = expired || ['declined', 'expired'].includes(quote.status);
  const accepted = quote.status === 'accepted';
  const paid = ['held', 'released'].includes(booking?.payment_status);

  const offered = quote.add_ons || [];
  const chosen = offered.filter((addOn) => picked.includes(addOn.name));
  const price = Number(quote.amount || 0);
  const subtotal =
    Math.round((price + chosen.reduce((sum, a) => sum + (Number(a.price) || 0), 0)) * 100) / 100;
  const fee = Math.round((clientTotal(subtotal) - subtotal) * 100) / 100;

  const toggle = (name) =>
    setPicked((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  const acceptAndPay = async () => {
    if (window.self !== window.top) {
      setError('Checkout only works in the published app. Open it in a new tab to pay.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const acceptedQuote = await base44.functions.invoke('acceptQuote', {
        quoteId: quote.id,
        pickedAddOns: chosen,
      });
      if (acceptedQuote.data?.error) {
        setError(acceptedQuote.data.error);
        return;
      }
      const checkout = await base44.functions.invoke('createBookingCheckout', {
        bookingId: booking.id,
        origin: window.location.origin,
      });
      if (checkout.data?.url) {
        window.location.href = checkout.data.url;
      } else {
        setError(checkout.data?.error || 'Payment could not be started.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'We could not accept this quote. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-[26px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-white/40">QUOTE</p>
          <p className="mt-2 text-[38px] font-semibold leading-none text-white">
            ${price.toLocaleString()}
          </p>
          <p className="mt-2 text-[14px] text-white/55">{quote.included_edits || 30} edited photos</p>
        </div>
        {quote.expires_at && !dead && (
          <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-white/40">
            <Clock className="h-3.5 w-3.5" />
            {new Date(quote.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {role === 'client' && !dead && !paid && offered.length > 0 && (
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
                  className="rounded-[980px] border px-4 py-2.5 text-[14px] transition-colors"
                  style={{
                    borderColor: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.14)',
                    background: active ? 'hsl(var(--neon-lime) / 0.12)' : 'transparent',
                    color: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {addOn.name}
                  {addOn.price ? ` · +$${Number(addOn.price).toLocaleString()}` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {role !== 'client' && offered.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {offered.map((addOn, i) => (
            <span
              key={i}
              className="rounded-[980px] bg-white/[0.08] px-4 py-2 text-[14px] text-white/65"
            >
              {addOn.name}
              {addOn.price ? ` · +$${addOn.price}` : ''}
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
              Paid — held by Stelli until your photos are delivered
            </p>
          ) : dead ? (
            <p className="mt-4 text-[13px] text-white/40">This quote expired</p>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-4 text-[13px] text-white/45">
                <span>Service fee · {Math.round(SERVICE_FEE_RATE * 100)}%</span>
                <span className="text-white/70">${fee.toLocaleString()}</span>
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
                {accepted
                  ? `Pay $${clientTotal(subtotal).toLocaleString()}`
                  : `Accept & pay $${clientTotal(subtotal).toLocaleString()}`}
              </Pill>

              <p className="mt-3 text-[12px] text-white/35">
                ${clientTotal(subtotal).toLocaleString()} total · held until delivery
              </p>
            </>
          )}
        </>
      )}

      {role === 'lensman' && !dead && !paid && (
        <p className="mt-4 text-[13px] text-white/40">
          {accepted ? 'Accepted — waiting on payment' : 'Waiting on the client'}
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