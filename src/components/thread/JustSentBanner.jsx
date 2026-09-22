import React, { useState } from 'react';
import { X } from 'lucide-react';

/** Shown once, right after a request goes in. Device-local and dismissable. */
export default function JustSentBanner({ bookingId, creatorName }) {
  const key = `stelli_just_sent_${bookingId}`;
  const [shown, setShown] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('sent') !== '1') return false;
    return !localStorage.getItem(key);
  });

  if (!shown) return null;

  const dismiss = () => {
    localStorage.setItem(key, '1');
    setShown(false);
  };

  const first = String(creatorName || '').trim().split(' ')[0] || 'them';

  return (
    <button
      onClick={dismiss}
      className="w-full text-left border px-5 py-4 flex items-start gap-3 transition-colors hover:bg-white/[0.04]"
      style={{ borderColor: 'hsl(var(--neon-lime) / 0.5)', background: 'hsl(var(--neon-lime) / 0.06)', borderRadius: 4 }}
    >
      <span className="flex-1 font-body text-[13px] leading-relaxed text-white/75">
        Request sent to {first}. Most creators reply within a day — we'll email you when they do.
      </span>
      <X className="w-4 h-4 shrink-0 text-white/35" />
    </button>
  );
}