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
          className="glass flex items-center gap-3.5 rounded-[22px] py-4 pl-[18px] pr-4 transition-colors hover:bg-white/[0.12]"
        >
          <span className="min-w-0 flex-1">
            <b className="block text-[16px] font-semibold text-white">{item.title}</b>
            {item.meta && <small className="mt-0.5 block text-[14px] text-white/55">{item.meta}</small>}
          </span>
          <Pill>{item.action}</Pill>
        </Link>
      ))}
    </div>
  );
}