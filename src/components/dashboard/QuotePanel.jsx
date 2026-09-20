import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, Clock } from 'lucide-react';

export default function QuotePanel({ quote, booking }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const expiresLabel = quote.expires_at
    ? new Date(quote.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const acceptAndPay = async () => {
    if (window.self !== window.top) {
      setError('Checkout only works in the published app. Open it in a new tab to pay.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const accepted = await base44.functions.invoke('acceptQuote', { quoteId: quote.id });
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
    <div className="border p-5" style={{ borderColor: 'rgba(26,39,68,0.18)', background: '#f0ede6' }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-2" style={{ color: 'rgba(26,39,68,0.3)' }}>
            Quote from your creator
          </p>
          <p className="font-display text-4xl font-semibold leading-none" style={{ color: '#1a2744' }}>
            ${(quote.amount || 0).toLocaleString()}
          </p>
        </div>
        {expiresLabel && (
          <span className="flex items-center gap-1.5 text-[10px] font-body shrink-0" style={{ color: 'rgba(26,39,68,0.45)' }}>
            <Clock className="w-3 h-3" /> Expires {expiresLabel}
          </span>
        )}
      </div>

      <div className="text-[11px] font-body space-y-1 mb-4" style={{ color: 'rgba(26,39,68,0.55)' }}>
        <p>{quote.included_edits || 30} edited photos included</p>
        {(quote.add_ons || []).map((addOn, i) => (
          <p key={i}>{addOn.name}{addOn.price ? ` · +$${addOn.price}` : ''}</p>
        ))}
      </div>

      {quote.message && (
        <p className="text-[12px] font-body leading-relaxed italic mb-4" style={{ color: 'rgba(26,39,68,0.5)' }}>
          “{quote.message}”
        </p>
      )}

      <button onClick={acceptAndPay} disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-body tracking-[0.08em] uppercase font-semibold disabled:opacity-50"
        style={{ background: '#1a2744', color: '#f0ede6' }}>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
        Accept & pay ${(quote.amount || 0).toLocaleString()}
      </button>

      <p className="text-[10px] font-body mt-3" style={{ color: 'rgba(26,39,68,0.4)' }}>
        Accepting creates your booking agreement. Payment is held until your photos are delivered.
      </p>

      {error && <p className="text-[11px] font-body mt-3" style={{ color: '#8a2b2b' }}>{error}</p>}
    </div>
  );
}