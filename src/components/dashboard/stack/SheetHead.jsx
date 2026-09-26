import React from 'react';
import { X } from 'lucide-react';
import { useStackClose } from './DashboardStack';

/** The head of every sheet: what this page is, and the way back out. */
export default function SheetHead({ title, subtitle }) {
  const close = useStackClose();

  return (
    <div className="flex items-end justify-between gap-4 pb-6 pt-[18px]">
      <div className="min-w-0">
        <h1
          className="font-display font-medium text-white"
          style={{ fontSize: 'clamp(32px, 7vw, 44px)', letterSpacing: '-0.03em', lineHeight: 1 }}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-[15px] text-white/55">{subtitle}</p>}
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Close and go back"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition-transform duration-300 hover:rotate-90 hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}