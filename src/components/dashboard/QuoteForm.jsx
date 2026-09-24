import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X, Loader2, Send } from 'lucide-react';

const MIN_QUOTE = 1;
const MAX_QUOTE = 50000;

const inputStyle = {
  className: 'w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 outline-none text-[13px] font-body text-white focus:border-neon-cyan',
  style: { borderRadius: 4 },
};

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
    <div className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'hsl(var(--surface))', borderRadius: 4 }}>
      <p className="label-mono text-[9px] text-white/35 mb-4">Send a quote</p>

      {booking.event_description && (
        <p className="font-body text-[12px] leading-relaxed mb-4 italic text-white/50">
          “{booking.event_description}”
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="block">
          <span className="block label-mono text-[9px] text-white/35 mb-1.5">Amount (USD) *</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1200" {...inputStyle} />
        </label>
        <label className="block">
          <span className="block label-mono text-[9px] text-white/35 mb-1.5">Edited photos</span>
          <input type="number" value={includedEdits} onChange={(e) => setIncludedEdits(e.target.value)} {...inputStyle} />
        </label>
      </div>

      <label className="block mb-3">
        <span className="block label-mono text-[9px] text-white/35 mb-1.5">Expires on</span>
        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} {...inputStyle} />
      </label>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="label-mono text-[9px] text-white/35">Line items</span>
          <button onClick={addRow} className="flex items-center gap-1 font-body text-[10px] text-white/55 hover:text-white">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {addOns.map((row, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input placeholder="Rush delivery" value={row.name} onChange={(e) => updateRow(i, 'name', e.target.value)} {...inputStyle} />
            <input type="number" placeholder="150" value={row.price} onChange={(e) => updateRow(i, 'price', e.target.value)} {...inputStyle} />
            <button onClick={() => removeRow(i)}><X className="w-3.5 h-3.5 text-white/35" /></button>
          </div>
        ))}
      </div>

      <label className="block mb-4">
        <span className="block label-mono text-[9px] text-white/35 mb-1.5">Note to the client</span>
        <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's included, what you loved about the brief…" {...inputStyle} />
      </label>

      <button
        onClick={send}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3 label-mono text-[10px] font-semibold disabled:opacity-50"
        style={{ background: '#2AE8F8', color: '#0a0f1e', borderRadius: 4 }}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Send quote
      </button>

      {error && <p className="font-body text-[11px] mt-3" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>}
    </div>
  );
}