import React from 'react';

// The Stelli stars, exactly as drawn, sprinkled down the home page. Kept to the
// edges, faint, and never in the way of a click.
const STARS_URL =
  'https://base44.app/api/apps/6a2c4e448e7fec52fb6d322a/files/mp/public/6a2c4e448e7fec52fb6d322a/4af9d5e6f_stelli-stars.png';

const STARS = [
  { top: '7%', left: '6%', height: 34, drift: 13, twinkle: 7, delay: 0 },
  { top: '15%', left: '88%', height: 24, drift: 17, twinkle: 9, delay: 1.2 },
  { top: '29%', left: '10%', height: 20, drift: 15, twinkle: 8, delay: 0.6 },
  { top: '37%', left: '85%', height: 28, drift: 19, twinkle: 11, delay: 2 },
  { top: '53%', left: '4%', height: 26, drift: 14, twinkle: 9, delay: 0.9 },
  { top: '63%', left: '91%', height: 22, drift: 16, twinkle: 10, delay: 1.6 },
  { top: '72%', left: '13%', height: 24, drift: 18, twinkle: 8, delay: 0.4 },
  { top: '81%', left: '87%', height: 34, drift: 15, twinkle: 12, delay: 2.4 },
  { top: '92%', left: '9%', height: 20, drift: 13, twinkle: 9, delay: 1.4 },
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