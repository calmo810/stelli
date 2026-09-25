import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, X } from 'lucide-react';
import { creatorPayout } from '@/lib/threadPricing';
import Pill from '@/components/shared/Pill';
import { fieldClass, labelClass } from '@/lib/glassField';

const EXPIRIES = [
  { value: '24h', label: '24 hours' },
  { value: '72h', label: '72 hours' },
  { value: '7d', label: '7 days' },
];

/** The creator's private quote sheet, opened from the thread. */
export default function QuoteComposer({ open, onClose, booking, payoutsReady, onSent }) {
  const [amount, setAmount] = useState('');
  const [edits, setEdits] = useState('30');
  const [note, setNote] = useState('');
  const [expiry, setExpiry] = useState('72h');
  const [addOn, setAddOn] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsPayouts, setNeedsPayouts] = useState(false);

  const startPayouts = async () => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('startPayoutSetup', { origin: window.location.origin });
      if (response.data?.url) window.location.href = response.data.url;
      else setError(response.data?.error || 'Payout setup could not be started.');
    } catch (e) {
      setError(e?.response?.data?.error || 'Payout setup could not be started.');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Add a price.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('sendQuote', {
        bookingId: booking.id,
        amount: Number(amount),
        message: note,
        includedEdits: Number(edits) || 30,
        addOns: addOn && addOn.name ? [addOn] : [],
        expiry,
      });
      if (response.data?.error) {
        setNeedsPayouts(Boolean(response.data.needsPayouts));
        setError(response.data.error);
        return;
      }
      onClose?.();
      setAmount('');
      setNote('');
      setAddOn(null);
      onSent?.();
    } catch (e) {
      const data = e?.response?.data || {};
      setNeedsPayouts(Boolean(data.needsPayouts));
      setError(data.error || 'The quote did not send. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.12] bg-ink/95 backdrop-blur-xl">
      <div className="mx-auto max-h-[85vh] w-full max-w-[640px] overflow-y-auto px-4 py-5 sm:px-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[11px] font-semibold text-white/45">SEND A QUOTE</p>
          <button type="button" onClick={() => onClose?.()} className="text-white/40 hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block">
          <span className={labelClass}>Your price · USD</span>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1200"
            className={`${fieldClass} text-[20px] font-semibold`}
          />
        </label>

        {amount && Number(amount) > 0 && (
          <p className="mt-2 text-[12px] text-white/40">
            You receive ${creatorPayout(Number(amount)).toLocaleString()} after Stelli's fee
          </p>
        )}

        <div className="mt-4">
          <span className={labelClass}>Good for</span>
          <div className="flex flex-wrap gap-2">
            {EXPIRIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setExpiry(option.value)}
                aria-pressed={expiry === option.value}
                className="rounded-[980px] border px-4 py-2.5 text-[14px] transition-colors"
                style={{
                  borderColor: expiry === option.value ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.14)',
                  background: expiry === option.value ? 'hsl(var(--neon-lime) / 0.12)' : 'transparent',
                  color: expiry === option.value ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.6)',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>Edited photos</span>
          <input
            type="number"
            min="0"
            value={edits}
            onChange={(e) => setEdits(e.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="mt-4 block">
          <span className={labelClass}>Note to the client · optional</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Two hours on location, golden hour"
            className={fieldClass}
          />
        </label>

        <div className="mt-4">
          {addOn ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={addOn.name}
                  placeholder="Rush delivery"
                  onChange={(e) => setAddOn({ ...addOn, name: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="w-24 shrink-0">
                <input
                  type="number"
                  min="0"
                  value={addOn.price}
                  placeholder="150"
                  onChange={(e) => setAddOn({ ...addOn, price: Number(e.target.value) })}
                  className={fieldClass}
                />
              </div>
              <button
                type="button"
                onClick={() => setAddOn(null)}
                className="shrink-0 text-white/40 hover:text-white"
                aria-label="Remove line item"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddOn({ name: '', price: 0 })}
              className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add a line item
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 text-[13px]" style={{ color: 'hsl(var(--neon-magenta))' }}>
            {error}
          </p>
        )}

        {needsPayouts && !payoutsReady ? (
          <Pill as="button" type="button" tone="lime" onClick={startPayouts} disabled={busy} className="mt-4 w-full py-4">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Set up payouts to send your first quote
          </Pill>
        ) : (
          <Pill as="button" type="button" tone="lime" onClick={send} disabled={busy} className="mt-4 w-full py-4">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Send quote
          </Pill>
        )}
      </div>
    </div>
  );
}