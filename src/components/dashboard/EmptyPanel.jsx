import React from 'react';

/** The calm panel an empty list gets. */
export default function EmptyPanel({ icon: Icon, title, body, cta }) {
  return (
    <div className="st-card flex min-h-[240px] flex-col items-center justify-center rounded-[28px] px-5 py-7 text-center">
      {Icon && (
        <span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-fill text-fg-2">
          <Icon className="h-6 w-6" strokeWidth={1.7} />
        </span>
      )}
      <h2 className="mt-3.5 font-display text-[24px] font-medium text-fg">{title}</h2>
      {body && <p className="mt-1.5 max-w-[320px] text-[15px] leading-snug text-fg-2">{body}</p>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}