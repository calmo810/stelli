import React from 'react';
import { Star } from 'lucide-react';

/**
 * Star rating for a profile, or a quiet "New" tag while it has no reviews yet.
 */
export default function RatingDisplay({
  rating = 0,
  reviewCount = 0,
  color = 'hsl(var(--neon-magenta))',
  className = '',
}) {
  if (!reviewCount) {
    return (
      <span
        className={`label-mono text-[9px] px-2.5 py-1.5 ${className}`}
        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', borderRadius: 3 }}
      >
        New
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Star className="w-3.5 h-3.5" style={{ color }} fill={color} />
      <span className="font-body text-[12px] text-white/75">{Number(rating || 0).toFixed(1)}</span>
    </span>
  );
}