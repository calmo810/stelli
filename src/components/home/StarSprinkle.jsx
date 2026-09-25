import React from 'react';
import StarCluster from '@/components/shared/StarCluster';

// Stars sprinkled down the home page. Kept to the edges, faint, and never in
// the way of a click.
const STARS = [
  { top: '7%', left: '6%', size: 30, tone: 'cream', rotate: -10, drift: 13, twinkle: 7, delay: 0 },
  { top: '15%', left: '88%', size: 22, tone: 'cream', rotate: 12, drift: 17, twinkle: 9, delay: 1.2 },
  { top: '29%', left: '10%', size: 18, tone: 'lime', rotate: 6, drift: 15, twinkle: 8, delay: 0.6 },
  { top: '37%', left: '85%', size: 26, tone: 'cream', rotate: -14, drift: 19, twinkle: 11, delay: 2 },
  { top: '53%', left: '4%', size: 24, tone: 'cream', rotate: 8, drift: 14, twinkle: 9, delay: 0.9 },
  { top: '63%', left: '91%', size: 20, tone: 'cream', rotate: -6, drift: 16, twinkle: 10, delay: 1.6 },
  { top: '72%', left: '13%', size: 22, tone: 'lime', rotate: -12, drift: 18, twinkle: 8, delay: 0.4 },
  { top: '81%', left: '87%', size: 30, tone: 'cream', rotate: 10, drift: 15, twinkle: 12, delay: 2.4 },
  { top: '92%', left: '9%', size: 18, tone: 'cream', rotate: -8, drift: 13, twinkle: 9, delay: 1.4 },
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
          <StarCluster size={star.size} tone={star.tone} rotate={star.rotate} />
        </span>
      ))}
    </div>
  );
}