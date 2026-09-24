import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, Clock } from 'lucide-react';
import { clientTotal, SERVICE_FEE_RATE } from '@/lib/threadPricing';

/** The client picks which add-ons they want, then pays for the whole lot. */
export default function QuotePanel({ quote, booking }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState([]);

  const offered = quote.add_ons || [];
  const chosen = offered.filter((addOn) => picked.includes(addOn.name));
  const subtotal =
    Math.round((Number(quote.amount || 0) + chosen.reduce((sum, a) => sum + (Number(a.price) || 0), 0)) * 100) / 100;
  const total = clientTotal(subtotal);
  const fee = Math.round((total - subtotal) * 100) / 100;

  const expiresLabel = quote.expires_at
    ? new Date(quote.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

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
    <div className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'hsl(var(--surface))', borderRadius: 4 }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="label-mono text-[9px] text-white/35 mb-2">Quote from your creator</p>
          <p className="font-heading text-4xl font-semibold leading-none text-white">
            ${(quote.amount || 0).toLocaleString()}
          </p>
        </div>
        {expiresLabel && (
          <span className="flex items-center gap-1.5 label-mono text-[9px] text-white/40 shrink-0">
            <Clock className="w-3 h-3" /> Expires {expiresLabel}
          </span>
        )}
      </div>

      <div className="font-body text-[12px] space-y-1 mb-4 text-white/55">
        <p>{quote.included_edits || 30} edited photos included</p>
      </div>

      {offered.length > 0 && (
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

      <div className="font-body text-[12px] space-y-1 mb-4 text-white/55">
        <p>Service fee · {Math.round(SERVICE_FEE_RATE * 100)}% · ${fee.toLocaleString()}</p>
        <p className="font-semibold text-white/80">Total charged ${total.toLocaleString()}</p>
      </div>

      {quote.message && (
        <p className="font-body text-[13px] leading-relaxed italic mb-4 text-white/50 border-l-2 border-white/10 pl-4">
          “{quote.message}”
        </p>
      )}

      <button
        onClick={acceptAndPay}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3 label-mono text-[10px] font-semibold disabled:opacity-50"
        style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
        Accept & pay ${total.toLocaleString()}
      </button>

      <p className="font-body text-[11px] mt-3 text-white/40">
        Accepting creates your booking agreement. Payment is held until your photos are delivered.
      </p>

      {error && <p className="font-body text-[11px] mt-3" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>}
    </div>
  );
}