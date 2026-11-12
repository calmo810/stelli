import React from 'react';
import { Link } from 'react-router-dom';
import Pill from '@/components/shared/Pill';
import EmptyPanel from './EmptyPanel';

/** The short list of things waiting on you, one tap each. */
export default function NeedsYou({ items = [], empty }) {
  if (!items.length) return <EmptyPanel {...empty} />;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.to}
          className="st-card flex items-center gap-3.5 rounded-[20px] py-2.5 pl-4 pr-2.5 transition-colors hover:bg-fill-2"
        >
          <span className="min-w-0 flex-1">
            <b className="block text-[15px] font-semibold text-fg">{item.title}</b>
            {item.meta && <small className="mt-0.5 block text-[13px] text-fg-3">{item.meta}</small>}
          </span>
          <Pill>{item.action}</Pill>
        </Link>
      ))}
    </div>
  );
}