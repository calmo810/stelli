import React from 'react';

// The Stelli logo as drawn by hand, traced to a vector so it stays sharp at any size.
export const LOGO_URL = '/stelli-logo.svg';

export default function StelliWordmark({ className = '' }) {
  return (
    <img
      src={LOGO_URL}
      alt="Stelli"
      className={`w-auto ${className}`}
      style={{ height: 34, filter: 'drop-shadow(0 1px 10px hsl(var(--ink) / 0.55))' }}
    />
  );
}