import React from 'react';
import { Link } from 'react-router-dom';

/** The four numbers a creator checks first, in one quiet row. */
export default function MetricGrid({ tiles = [] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {tiles.map(({ key, label, value, note, icon: Icon, to }) => {
        const body = (
          <>
            <span className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/40">
                {label}
              </span>
              {Icon && <Icon className="h-[15px] w-[15px] shrink-0 text-white/25" strokeWidth={1.9} />}
            </span>
            <p className="mt-2 font-display text-[27px] leading-none tracking-tight text-white">{value}</p>
            {note && <p className="mt-1.5 block text-[11px] leading-tight text-white/40">{note}</p>}
          </>
        );

        const shell = 'glass block rounded-[22px] px-3.5 py-3.5 transition-colors';

        return to ? (
          <Link key={key} to={to} className={`${shell} hover:bg-white/[0.12]`}>
            {body}
          </Link>
        ) : (
          <div key={key} className={shell}>
            {body}
          </div>
        );
      })}
    </div>
  );
}