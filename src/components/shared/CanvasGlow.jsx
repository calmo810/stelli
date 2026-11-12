import React from 'react';

/**
 * The soft light at the top of the ink canvas — the same field the portal
 * sits under (see DashboardShell). Place it first inside a `relative
 * overflow-hidden` page wrapper.
 */
export default function CanvasGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
      <div
        className="absolute left-1/2 -top-[260px] h-[420px] w-[700px] -translate-x-1/2 rounded-full"
        style={{ background: 'rgba(255,255,255,0.07)', filter: 'blur(90px)' }}
      />
    </div>
  );
}
