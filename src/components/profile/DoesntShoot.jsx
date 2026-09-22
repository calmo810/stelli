import React from 'react';

export default function DoesntShoot({ line }) {
  if (!line) return null;

  return (
    <div className="mt-7">
      <p className="label-mono text-[9px] text-white/30 mb-2">Doesn't shoot</p>
      <p className="font-body text-[13px] leading-relaxed text-white/55 max-w-md">{line}</p>
    </div>
  );
}