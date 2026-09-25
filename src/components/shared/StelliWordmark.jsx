import React from 'react';
import StarCluster from './StarCluster';

/**
 * The Stelli wordmark: the hand-inked script name with the three stars riding
 * at the end of it, all in the brand blue.
 */
export default function StelliWordmark({ className = '' }) {
  return (
    <span
      className={`flex items-end ${className}`}
      style={{ filter: 'drop-shadow(0 1px 10px hsl(var(--ink) / 0.55))' }}
    >
      <span className="font-script text-stelli-blue leading-[0.9]" style={{ fontSize: 34 }}>
        Stelli
      </span>
      <StarCluster size={30} className="mb-[2px]" rotate={-6} />
    </span>
  );
}