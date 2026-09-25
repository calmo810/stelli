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
      className="glass flex w-full items-start gap-3 rounded-[22px] px-[18px] py-4 text-left"
      style={{ borderColor: 'hsl(var(--neon-lime) / 0.5)' }}
    >
      <span className="flex-1 text-[14px] leading-relaxed text-white/75">
        Request sent to {first}. Most creators reply within a day — we'll email you when they do.
      </span>
      <X className="w-4 h-4 shrink-0 text-white/35" />
    </button>
  );
}