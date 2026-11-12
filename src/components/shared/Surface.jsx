import React from 'react';
import { cn } from '@/lib/utils';

/** A hairline card on the ink canvas. No shadow, no gradient — just an edge. */
export default function Surface({ as: Tag = 'div', className = '', hover = false, children, ...rest }) {
  return (
    <Tag
      className={cn(
        'border border-line bg-[var(--st-card)] rounded-[18px]',
        hover && 'transition-colors duration-300 hover:border-line-2',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}