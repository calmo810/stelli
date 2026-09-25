import React from 'react';

// The Stelli logo exactly as drawn by hand, cut out and turned white.
const LOGO_URL =
  'https://base44.app/api/apps/6a2c4e448e7fec52fb6d322a/files/mp/public/6a2c4e448e7fec52fb6d322a/efc3c3dbb_stelli-wordmark-white.png';

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