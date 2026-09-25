import React from 'react';

// The three stars of the Stelli mark: one up top, a small one low left, the
// biggest to the right. Drawn as vectors so they stay crisp at any size.
const SPARKLE = 'M12 2 C12 8 8 12 2 12 C8 12 12 16 12 22 C12 16 16 12 22 12 C16 12 12 8 12 2 Z';

const STARS = [
  { x: 8, y: 0, scale: 0.52, rotate: 9 },
  { x: 0, y: 14, scale: 0.44, rotate: -16 },
  { x: 20, y: 3, scale: 0.7, rotate: -7 },
];

/**
 * The Stelli three-star mark. `tone` picks the ink: cream by default, lime for
 * the few that carry the brand accent.
 */
export default function StarCluster({ size = 26, tone = 'cream', rotate = 0, className = '', style }) {
  return (
    <svg
      viewBox="0 0 37 27"
      width={size}
      height={Math.round((size * 27) / 37)}
      aria-hidden
      className={`${tone === 'lime' ? 'fill-neon-lime' : 'fill-stelli-cream'} ${className}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
    >
      {STARS.map((star, i) => (
        <path
          key={i}
          d={SPARKLE}
          transform={`translate(${star.x} ${star.y}) rotate(${star.rotate} 12 12) scale(${star.scale})`}
        />
      ))}
    </svg>
  );
}