import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** A settings-style stack of glass rows. */
export default function GlassRows({ rows, className = '' }) {
  return (
    <div className={`glass overflow-hidden rounded-3xl ${className}`}>
      {rows.map((row, i) => {
        const inner = (
          <>
            <span className="flex-1 text-[15px]">{row.label}</span>
            {row.value && <span className="text-[14px] text-white/45">{row.value}</span>}
            <ChevronRight className="h-4 w-4 text-white/35" strokeWidth={2.4} />
          </>
        );
        const cls = `flex items-center gap-3.5 px-[18px] py-4 transition-colors hover:bg-white/[0.05]${
          i ? ' border-t border-white/[0.08]' : ''
        }`;

        if (row.to) {
          return (
            <Link key={row.label} to={row.to} className={cls}>
              {inner}
            </Link>
          );
        }
        return (
          <a
            key={row.label}
            href={row.href}
            target={row.external ? '_blank' : undefined}
            rel={row.external ? 'noreferrer' : undefined}
            className={cls}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}