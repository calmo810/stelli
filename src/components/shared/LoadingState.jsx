import React from 'react';

/** The one loading treatment: a small lime tick and a quiet word. */
export default function LoadingState({ label = 'Loading' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-20 text-white/40">
      <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-neon-lime animate-spin" />
      <span className="label-mono text-[10px]">{label}</span>
    </div>
  );
}