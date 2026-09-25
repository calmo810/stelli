import React from 'react';
import Surface from './Surface';

/** Nothing here yet — said plainly, with one way forward if there is one. */
export default function EmptyState({ title, line, action }) {
  return (
    <Surface className="px-6 py-16 text-center">
      <p className="text-[17px] font-semibold text-white">{title}</p>
      {line && <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-white/45">{line}</p>}
      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </Surface>
  );
}