import React from 'react';

const TONES = {
  cyan: { background: 'hsl(var(--neon-cyan))', color: 'hsl(var(--ink))' },
  lime: { background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' },
  glass: { background: 'rgba(255,255,255,0.12)', color: '#fff' },
};

/** The one button shape the dashboards use: a rounded pill. */
export default function Pill({ as: Tag = 'span', tone = 'cyan', className = '', style, ...rest }) {
  return (
    <Tag
      className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[980px] px-[18px] py-[11px] text-[14px] font-semibold transition-transform active:scale-[0.96] disabled:opacity-50 ${className}`}
      style={{ ...TONES[tone], ...style }}
      {...rest}
    />
  );
}