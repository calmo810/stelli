import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X, Loader2, Send } from 'lucide-react';
import Pill from '@/components/shared/Pill';
import { fieldClass, labelClass } from '@/lib/glassField';

const MIN_QUOTE = 1;
const MAX_QUOTE = 50000;

export default function QuoteForm({ booking, onSent }) {
  const [amount, setAmount] = useState('');
  const [includedEdits, setIncludedEdits] = useState(30);
  const [expiresAt, setExpiresAt] = useState('');
  const [message, setMessage] = useState('');
  const [addOns, setAddOns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addRow = () => setAddOns((prev) => [...prev, { name: '', price: '' }]);
  const updateRow = (index, key, value) =>
    setAddOns((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const removeRow = (index) => setAddOns((prev) => prev.filter((_, i) => i !== index));

  const send = async () => {
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value < MIN_QUOTE || value > MAX_QUOTE) {
      setError('Quotes can be $1 to $50,000.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await base44.functions.invoke('sendQuote', {
        bookingId: booking.id,
        amount: value,
        message,
        includedEdits: Number(includedEdits) || 30,
        addOns: addOns
          .filter((row) => row.name)
          .map((row) => ({ name: row.name, price: Number(row.price) || 0 })),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : '',
      });
      onSent?.();
    } catch (e) {
      setError(e?.response?.data?.error || 'The quote could not be sent.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-[26px] p-5">
      <p className="text-[11px] font-semibold text-white/40">SEND A QUOTE</p>

      {booking.event_description && (
        <p className="mt-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-[15px] leading-relaxed text-white/70">
          {booking.event_description}
        </p>
      )}

      <label className="mt-4 block">
        <span className={labelClass}>Your price · USD</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1200"
          className={`${fieldClass} text-[20px] font-semibold`}
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>Edited photos</span>
          <input
            type="number"
            value={includedEdits}
            onChange={(e) => setIncludedEdits(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Expires on</span>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className={labelClass}>Note to the client</span>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's included, what you loved about the brief…"
          className={fieldClass}
        />
      </label>

      <div className="mt-4">
        {addOns.map((row, i) => (
          <div key={i} className="mb-2 flex items-center gap-2">
            <div className="flex-1">
              <input
                placeholder="Rush delivery"
                value={row.name}
                onChange={(e) => updateRow(i, 'name', e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="w-24 shrink-0">
              <input
                type="number"
                placeholder="150"
                value={row.price}
                onChange={(e) => updateRow(i, 'price', e.target.value)}
                className={fieldClass}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="shrink-0 text-white/40 hover:text-white"
              aria-label="Remove line item"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Add a line item
        </button>
      </div>

      <Pill as="button" type="button" tone="lime" onClick={send} disabled={busy} className="mt-4 w-full py-4">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send quote
      </Pill>

      {error && (
        <p className="mt-3 text-[13px]" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {error}
        </p>
      )}
    </div>
  );
}