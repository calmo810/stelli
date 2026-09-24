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
    <div className="border p-5" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'hsl(var(--surface))', borderRadius: 4 }}>
      <p className="label-mono text-[9px] text-white/35 mb-4">Deliver the gallery</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          placeholder="https://gallery.example.com/your-shoot"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-white/[0.03] border border-white/10 outline-none font-body text-[13px] text-white focus:border-neon-cyan"
          style={{ borderRadius: 4 }}
        />
        <button
          onClick={deliver}
          disabled={busy}
          className="flex items-center justify-center gap-2 px-5 py-2.5 label-mono text-[10px] font-semibold disabled:opacity-50"
          style={{ background: '#2AE8F8', color: '#0a0f1e', borderRadius: 4 }}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
          Deliver
        </button>
      </div>
      <p className="font-body text-[11px] mt-3 text-white/40">
        Both of you get an email with the link the moment you send it.
      </p>
      {error && <p className="font-body text-[11px] mt-2" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>}
    </div>
  );
}