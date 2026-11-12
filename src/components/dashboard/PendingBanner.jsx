import React from 'react';

/**
 * One quiet line at the top of the workspace. Used for review states.
 * @param {{ children?: import('react').ReactNode, tone?: string }} props
 */
export default function PendingBanner({ children = 'Your profile is under review. It goes live once we approve it.', tone = 'cyan' }) {
  return (
    <div className="wk-card mt-5 flex items-center gap-3.5 px-[18px] py-4">
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: `hsl(var(--neon-${tone}))` }}
      />
      <p className="wk-body">{children}</p>
    </div>
  );
}