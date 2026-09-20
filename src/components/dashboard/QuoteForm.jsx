import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X, Loader2, Send } from 'lucide-react';

const inputStyle = {
  className: 'w-full px-3 py-2.5 bg-transparent border outline-none text-[13px] font-body',
  style: { borderColor: 'rgba(26,39,68,0.16)', color: '#1a2744' },
};

export default function QuoteForm({ booking, onSent }) {
  const [amount, setAmount] = useState('');
  const [includedEdits, setIncludedEdits] = useState(30);
  const [expiresAt, setExpiresAt] = useState('');
  const [message, setMessage] = useState('');
  const [addOns, setAddOns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addRow = () => setAddOns(prev => [...prev, { name: '', price: '' }]);
  const updateRow = (index, key, value) =>
    setAddOns(prev => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const removeRow = (index) => setAddOns(prev => prev.filter((_, i) => i !== index));

  const send = async () => {
    if (!amount) {
      setError('Enter the amount you want to quote.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await base44.functions.invoke('sendQuote', {
        bookingId: booking.id,
        amount: Number(amount),
        message,
        includedEdits: Number(includedEdits) || 30,
        addOns: addOns
          .filter(row => row.name)
          .map(row => ({ name: row.name, price: Number(row.price) || 0 })),
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
    <div className="border p-5" style={{ borderColor: 'rgba(26,39,68,0.14)', background: '#f0ede6' }}>
      <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.3)' }}>
        Send a quote
      </p>

      {booking.event_description && (
        <p className="text-[12px] font-body leading-relaxed mb-4 italic" style={{ color: 'rgba(26,39,68,0.5)' }}>
          “{booking.event_description}”
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="block">
          <span className="block text-[9px] font-body tracking-[0.18em] uppercase mb-1.5" style={{ color: 'rgba(26,39,68,0.35)' }}>Amount (USD) *</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1200" {...inputStyle} />
        </label>
        <label className="block">
          <span className="block text-[9px] font-body tracking-[0.18em] uppercase mb-1.5" style={{ color: 'rgba(26,39,68,0.35)' }}>Edited photos</span>
          <input type="number" value={includedEdits} onChange={e => setIncludedEdits(e.target.value)} {...inputStyle} />
        </label>
      </div>

      <label className="block mb-3">
        <span className="block text-[9px] font-body tracking-[0.18em] uppercase mb-1.5" style={{ color: 'rgba(26,39,68,0.35)' }}>Expires on</span>
        <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} {...inputStyle} />
      </label>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-body tracking-[0.18em] uppercase" style={{ color: 'rgba(26,39,68,0.35)' }}>Line items</span>
          <button onClick={addRow} className="flex items-center gap-1 text-[10px] font-body" style={{ color: 'rgba(26,39,68,0.55)' }}>
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {addOns.map((row, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input placeholder="Rush delivery" value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} {...inputStyle} />
            <input type="number" placeholder="150" value={row.price} onChange={e => updateRow(i, 'price', e.target.value)} {...inputStyle} />
            <button onClick={() => removeRow(i)}><X className="w-3.5 h-3.5" style={{ color: 'rgba(26,39,68,0.35)' }} /></button>
          </div>
        ))}
      </div>

      <label className="block mb-4">
        <span className="block text-[9px] font-body tracking-[0.18em] uppercase mb-1.5" style={{ color: 'rgba(26,39,68,0.35)' }}>Note to the client</span>
        <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="What's included, what you loved about the brief..." {...inputStyle} />
      </label>

      <button onClick={send} disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-body tracking-[0.08em] uppercase font-semibold disabled:opacity-50"
        style={{ background: '#1a2744', color: '#f0ede6' }}>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Send quote
      </button>

      {error && <p className="text-[11px] font-body mt-3" style={{ color: '#8a2b2b' }}>{error}</p>}
    </div>
  );
}