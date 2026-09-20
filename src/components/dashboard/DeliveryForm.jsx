import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Link2 } from 'lucide-react';

export default function DeliveryForm({ booking, onDelivered }) {
  const [link, setLink] = useState(booking.delivery_link || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const deliver = async () => {
    if (!link.trim()) {
      setError('Paste the gallery link first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await base44.functions.invoke('markDelivered', {
        bookingId: booking.id,
        deliveryLink: link.trim(),
      });
      onDelivered?.();
    } catch (e) {
      setError(e?.response?.data?.error || 'The delivery could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border p-5" style={{ borderColor: 'rgba(26,39,68,0.14)', background: '#f0ede6' }}>
      <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.3)' }}>
        Deliver the gallery
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://gallery.example.com/your-shoot"
          value={link}
          onChange={e => setLink(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-transparent border outline-none text-[13px] font-body"
          style={{ borderColor: 'rgba(26,39,68,0.16)', color: '#1a2744' }}
        />
        <button onClick={deliver} disabled={busy}
          className="flex items-center gap-2 px-5 rounded-full text-[10px] font-body tracking-[0.08em] uppercase font-semibold disabled:opacity-50"
          style={{ background: '#1a2744', color: '#f0ede6' }}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
          Deliver
        </button>
      </div>
      <p className="text-[10px] font-body mt-3" style={{ color: 'rgba(26,39,68,0.4)' }}>
        Both of you get an email with the link the moment you send it.
      </p>
      {error && <p className="text-[11px] font-body mt-2" style={{ color: '#8a2b2b' }}>{error}</p>}
    </div>
  );
}