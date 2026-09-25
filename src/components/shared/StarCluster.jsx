import React from 'react';

// A four-pointed star with long, thin, uneven arms — hand-drawn rather than
// geometric. `waist` is how close the sides pinch in toward the centre.
const sparkle = (up, right, down, left, waist = 0.14) =>
  [
    `M0 ${-up}`,
    `Q ${right * waist} ${-up * waist} ${right} 0`,
    `Q ${right * waist} ${down * waist} 0 ${down}`,
    `Q ${-left * waist} ${down * waist} ${-left} 0`,
    `Q ${-left * waist} ${-up * waist} 0 ${-up}`,
    'Z',
  ].join(' ');

// The three stars of the Stelli mark: one top left, a smaller one below it,
// the biggest one to the right.
const STARS = [
  { d: sparkle(9, 7, 8, 6.5), x: 11, y: 9, rotate: 6 },
  { d: sparkle(7, 6, 6.5, 5.5), x: 6, y: 26, rotate: -18 },
  { d: sparkle(12, 8.5, 13, 8), x: 29, y: 20, rotate: -8 },
];

/**
 * The Stelli three-star mark, in the brand blue, with the ink-stamp grain of
 * the original artwork punched through it.
 */
export default function StarCluster({ size = 26, rotate = 0, className = '', style }) {
  const filterId = `stelliInk${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      viewBox="0 0 40 36"
      width={size}
      height={Math.round((size * 36) / 40)}
      aria-hidden
      className={`fill-stelli-blue ${className}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
    >
      <defs>
        <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="11" result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 -0.55"
            result="flecks"
          />
          <feComposite in="SourceGraphic" in2="flecks" operator="out" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {STARS.map((star, i) => (
          <path key={i} d={star.d} transform={`translate(${star.x} ${star.y}) rotate(${star.rotate})`} />
        ))}
      </g>
    </svg>
  );
}