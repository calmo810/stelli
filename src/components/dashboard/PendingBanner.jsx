import React from 'react';
import { Clock } from 'lucide-react';

/** Slim notice at the top of a creator's dashboard while they wait for review. */
export default function PendingBanner() {
  return (
    <div
      className="mb-6 flex items-center gap-3 px-4 py-3 text-xs"
      style={{ background: 'rgba(26,39,68,0.06)', border: '1px solid rgba(26,39,68,0.14)', color: 'rgba(26,39,68,0.65)' }}
    >
      <Clock className="w-3.5 h-3.5 shrink-0" />
      Your profile is under review. It goes live once we approve it.
    </div>
  );
}