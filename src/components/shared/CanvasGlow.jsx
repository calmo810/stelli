import React from 'react';

// Fades the light in from the top, so it never shows a hard edge under the
// back button that sits above most pages.
const FADE_IN = 'linear-gradient(to bottom, transparent 0, #000 160px)';

/**
 * The soft light at the top of the ink canvas — the same field the portal
 * sits under (see DashboardShell). Place it first inside a `relative` page
 * wrapper.
 */
export default function CanvasGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden"
      style={{ maskImage: FADE_IN, WebkitMaskImage: FADE_IN }}
    >
      <div
        className="absolute left-1/2 -top-[260px] h-[420px] w-[700px] -translate-x-1/2 rounded-full"
        style={{ background: 'rgba(255,255,255,0.07)', filter: 'blur(90px)' }}
      />
    </div>
  );
}
