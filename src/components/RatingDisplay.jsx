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
        className={`st-kicker px-2.5 py-1.5 ${className}`}
        style={{ background: 'var(--fill)', color: 'var(--fg-2)', borderRadius: 16 }}
      >
        New
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Star className="w-3.5 h-3.5" style={{ color }} fill={color} />
      <span className="text-[12px] text-fg-2">{Number(rating || 0).toFixed(1)}</span>
    </span>
  );
}