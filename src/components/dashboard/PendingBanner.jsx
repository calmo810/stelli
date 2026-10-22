import React from 'react';

/** One quiet line at the top of the dashboard. Used for review states. */
export default function PendingBanner({ children = 'Your profile is under review. It goes live once we approve it.', tone = 'cyan' }) {
  return (
    <div className="glass mt-5 flex items-center gap-3.5 rounded-[22px] px-[18px] py-4">
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `hsl(var(--neon-${tone}))` }} />
      <p className="text-[14px] leading-snug text-white/70">{children}</p>
    </div>
  );
}
