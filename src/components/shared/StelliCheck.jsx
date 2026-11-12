import React from 'react';
import { Check } from 'lucide-react';

/**
 * The one checkbox: a real checkbox (so keyboards and screen readers work as
 * usual) drawn as a small rounded box that fills lime when ticked.
 */
export default function StelliCheck({ checked, onChange, children, className = '' }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 ${className}`}>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-[7px] border border-white/25 bg-white/[0.06] transition-colors peer-checked:border-neon-lime peer-checked:bg-neon-lime peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neon-lime"
      >
        <Check className={`h-3.5 w-3.5 text-ink transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
      </span>
      <span className="text-[14px] leading-snug text-white/70">{children}</span>
    </label>
  );
}
