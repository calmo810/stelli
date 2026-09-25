import React from 'react';

const WIDTHS = {
  wide: 'max-w-[1240px]',
  narrow: 'max-w-[1040px]',
  reading: 'max-w-[760px]',
};

/**
 * Every page sits in the same shell: ink canvas, one measure, room to breathe.
 * width="reading" for legal and long-form copy, "narrow" for forms.
 */
export default function PageShell({ width = 'wide', children, className = '' }) {
  return (
    <div className="min-h-screen bg-ink text-white">
      <div className={`mx-auto px-5 md:px-10 pt-24 md:pt-32 pb-24 md:pb-32 ${WIDTHS[width]} ${className}`}>
        {children}
      </div>
    </div>
  );
}