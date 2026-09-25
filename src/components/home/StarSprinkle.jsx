import React from 'react';

// The Stelli stars, exactly as drawn, sprinkled down the home page. Kept to the
// edges, faint, and never in the way of a click.
const STARS_URL =
  'https://base44.app/api/apps/6a2c4e448e7fec52fb6d322a/files/mp/public/6a2c4e448e7fec52fb6d322a/4af9d5e6f_stelli-stars.png';

const STARS = [
  { top: '16%', left: '7%', height: 26, drift: 14, twinkle: 8, delay: 0 },
  { top: '30%', left: '88%', height: 20, drift: 17, twinkle: 10, delay: 1.2 },
  { top: '66%', left: '5%', height: 22, drift: 15, twinkle: 9, delay: 0.6 },
];

export default function StarSprinkle() {
  return (
    <div aria-hidden className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
      {STARS.map((star, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            top: star.top,
            left: star.left,
            animation: `stelliStarDrift ${star.drift}s ease-in-out ${star.delay}s infinite alternate, stelliStarTwinkle ${star.twinkle}s ease-in-out ${star.delay}s infinite`,
          }}
        >
          <img src={STARS_URL} alt="" className="w-auto" style={{ height: star.height }} />
        </span>
      ))}
    </div>
  );
}