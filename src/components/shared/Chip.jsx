import React from 'react';
import { cn } from '@/lib/utils';

/** A small filter pill. Lime when it is on, hairline when it is off. */
export default function Chip({ active = false, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'label-mono text-[10px] px-3.5 py-2 rounded-full border transition-colors duration-200',
        active
          ? 'border-neon-lime bg-neon-lime text-ink'
          : 'border-white/15 text-white/50 hover:border-white/35 hover:text-white',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}