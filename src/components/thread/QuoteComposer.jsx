import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, Plus, X } from 'lucide-react';
import { creatorPayout } from '@/lib/threadPricing';

const fieldClass =
  'w-full border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-[14px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-neon-lime focus:ring-1 focus:ring-neon-lime';

const EXPIRIES = [
  { value: '24h', label: '24 hours' },
  { value: '72h', label: '72 hours' },
  { value: '7d', label: '7 days' },
];

/** The creator's private quote, sent from beside the composer. */
export default function QuoteComposer({ booking, payoutsReady, onSent }) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-2 label-mono text-[10px] font-semibold px-4 py-3.5"
        style={{ background: 'hsl(var(--neon-cyan))', color: 'hsl(var(--ink))', borderRadius: 4 }}
      >
        <FileText className="w-3.5 h-3.5" /> Send quote
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/15 bg-ink/98 backdrop-blur">
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="label-mono text-[10px] text-white/50">Private quote</p>
          <button onClick={() => setOpen(false)} className="text-white/35 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="block label-mono text-[9px] text-white/35 mb-2">Price · USD</span>
            <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className="block label-mono text-[9px] text-white/35 mb-2">Edited photos</span>
            <input type="number" min="0" value={edits} onChange={(e) => setEdits(e.target.value)} className={fieldClass} />
          </label>
        </div>

        <label className="block mb-4">
          <span className="block label-mono text-[9px] text-white/35 mb-2">Note · optional</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Two hours on location, golden hour" className={fieldClass} />
        </label>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {EXPIRIES.map((option) => (
            <button
              key={option.value}
              onClick={() => setExpiry(option.value)}
              className="label-mono text-[9px] px-3 py-2 border transition-colors"
              style={{
                borderRadius: 3,
                borderColor: expiry === option.value ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.12)',
                color: expiry === option.value ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.45)',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {addOn ? (
          <div className="flex items-center gap-3 mb-4">
            <input type="text" value={addOn.name} placeholder="Add-on" onChange={(e) => setAddOn({ ...addOn, name: e.target.value })} className={fieldClass} />
            <input type="number" min="0" value={addOn.price} placeholder="Price" onChange={(e) => setAddOn({ ...addOn, price: Number(e.target.value) })} className={fieldClass} />
            <button onClick={() => setAddOn(null)} className="text-white/35 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => setAddOn({ name: '', price: 0 })} className="label-mono text-[9px] text-white/35 hover:text-neon-lime mb-4 flex items-center gap-1.5">
            <Plus className="w-3 h-3" /> Add a line item
          </button>
        )}

        {amount && Number(amount) > 0 && (
          <p className="label-mono text-[9px] text-white/30 mb-4">
            You receive ${creatorPayout(Number(amount)).toLocaleString()} after Stelli's fee
          </p>
        )}

        {error && (
          <p className="font-body text-[12px] mb-4" style={{ color: 'hsl(var(--neon-magenta))' }}>
            {error}
          </p>
        )}

        {needsPayouts && !payoutsReady ? (
          <button
            onClick={startPayouts}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3.5 label-mono text-[10px] font-semibold disabled:opacity-50"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Set up payouts to send your first quote
          </button>
        ) : (
          <button
            onClick={send}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3.5 label-mono text-[10px] font-semibold disabled:opacity-50"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Send quote
          </button>
        )}
      </div>
    </div>
  );
}