import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Lock, Clock } from 'lucide-react';
import { clientTotal, SERVICE_FEE_RATE } from '@/lib/threadPricing';

/** A creator's quote, as an editorial card in the thread. */
export default function QuoteCard({ quote, booking, role, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState([]);

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
      const accepted = await base44.functions.invoke('acceptQuote', {
        quoteId: quote.id,
        pickedAddOns: chosen,
      });
      if (accepted.data?.error) {
        setError(accepted.data.error);
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
    <div className="border p-5 sm:p-6" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="label-mono text-[9px] text-white/35 mb-3">Quote</p>
          <p className="font-heading text-4xl sm:text-5xl font-semibold text-white leading-none">
            ${price.toLocaleString()}
          </p>
        </div>
        {quote.expires_at && !dead && (
          <span className="flex items-center gap-1.5 label-mono text-[9px] text-white/35 shrink-0">
            <Clock className="w-3 h-3" />
            {new Date(quote.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <div className="space-y-1.5 mb-4">
        <p className="font-body text-[13px] text-white/60">{quote.included_edits || 30} edited photos</p>
      </div>

      {role === 'client' && !dead && !paid && offered.length > 0 && (
        <div className="mb-4">
          <p className="label-mono text-[9px] text-white/35 mb-3">Add-ons</p>
          <div className="space-y-2">
            {offered.map((addOn) => {
              const active = picked.includes(addOn.name);
              return (
                <button
                  key={addOn.name}
                  type="button"
                  onClick={() => toggle(addOn.name)}
                  aria-pressed={active}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 border text-left transition-colors"
                  style={{
                    borderRadius: 4,
                    borderColor: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.12)',
                    background: active ? 'hsl(var(--neon-lime) / 0.08)' : 'transparent',
                  }}
                >
                  <span className="font-body text-[13px] text-white/75">{addOn.name}</span>
                  <span className="label-mono text-[10px] text-white/60">
                    {addOn.price ? `+$${Number(addOn.price).toLocaleString()}` : 'Included'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {role !== 'client' && offered.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {offered.map((addOn, i) => (
            <p key={i} className="font-body text-[13px] text-white/60">
              {addOn.name}
              {addOn.price ? ` · +$${addOn.price}` : ''}
            </p>
          ))}
        </div>
      )}

      {quote.message && (
        <p className="font-body text-[14px] leading-relaxed italic text-white/55 mb-5 border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          “{quote.message}”
        </p>
      )}

      {role === 'client' && (
        <>
          {paid ? (
            <p className="label-mono text-[9px]" style={{ color: 'hsl(var(--neon-lime))' }}>
              Paid · payment held by Stelli until your photos are delivered
            </p>
          ) : dead ? (
            <p className="label-mono text-[9px] text-white/35">This quote expired</p>
          ) : (
            <>
              <div className="flex items-center justify-between label-mono text-[10px] text-white/40 mb-4 pt-1 border-t border-white/10">
                <span className="pt-3">Service fee · {Math.round(SERVICE_FEE_RATE * 100)}%</span>
                <span className="pt-3 text-white/60">${fee.toLocaleString()}</span>
              </div>
              <button
                onClick={acceptAndPay}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2.5 py-4 label-mono text-[11px] font-semibold disabled:opacity-50"
                style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                {accepted
                  ? `Pay $${clientTotal(subtotal).toLocaleString()}`
                  : `Accept & pay $${clientTotal(subtotal).toLocaleString()}`}
              </button>
              <p className="label-mono text-[9px] text-white/30 mt-3">
                Total charged ${clientTotal(subtotal).toLocaleString()} · held until delivery
              </p>
            </>
          )}
        </>
      )}

      {role === 'lensman' && !dead && !paid && (
        <p className="label-mono text-[9px] text-white/35">
          {accepted ? 'Accepted — waiting on payment' : 'Waiting on the client'}
        </p>
      )}

      {error && (
        <p className="font-body text-[12px] mt-4" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {error}
        </p>
      )}
    </div>
  );
}