import React from 'react';
import StarCluster from './StarCluster';

/**
 * The hand-inked Stelli wordmark, recut in light tones for the dark header:
 * the script name with the three stars riding at the end of it.
 */
export default function StelliWordmark({ className = '' }) {
  return (
    <span
      className={`flex items-end ${className}`}
      style={{ filter: 'drop-shadow(0 1px 10px hsl(var(--ink) / 0.55))' }}
    >
      <span className="font-hand font-bold text-stelli-cream leading-[0.8]" style={{ fontSize: 30 }}>
        Stelli
      </span>
      <StarCluster size={30} className="mb-[3px]" rotate={-6} />
    </span>
  );
}