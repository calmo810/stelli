import React from 'react';

/** A soft light field behind one narrow column of st-card — the dashboard canvas. */
export default function DashboardShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <div
          className="absolute left-1/2 -top-[260px] h-[420px] w-[700px] -translate-x-1/2 rounded-full"
          style={{ background: 'var(--fill)', filter: 'blur(90px)' }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[640px] px-4 pt-8 pb-24 sm:px-5">
        {children}
      </div>
    </div>
  );
}