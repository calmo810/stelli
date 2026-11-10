import React from 'react';

/** The small heading that opens each block of the creator workspace. */
export default function SectionLabel({ children, action = null }) {
  return (
    <div className="mb-2.5 mt-7 flex items-baseline justify-between gap-3 pl-1.5">
      <h2 className="text-[13px] font-semibold text-white/50">{children}</h2>
      {action}
    </div>
  );
}