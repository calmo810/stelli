/**
 * Stand-in pictures for the mock backend: soft, photo-shaped SVGs drawn from a
 * name, so the same address always gives the same picture and nothing has to
 * be downloaded. "photo-7-900x1200.svg" is picture 7 at that size;
 * "face-3.svg" is a square portrait.
 */
const PALETTES = [
  ['#f6c9a8', '#e58a6d', '#3b2a4a', '#1a1630'],
  ['#bfe3f0', '#6fa8c9', '#2d4f73', '#101c33'],
  ['#f3e7b3', '#d9a441', '#7a4a1f', '#2a1a10'],
  ['#d8c4f0', '#9a7fd1', '#3d2f6b', '#15102a'],
  ['#c9ecc3', '#6fb38a', '#22513f', '#0c1f1a'],
  ['#f7c6d6', '#e0708f', '#6b2140', '#210b18'],
  ['#e8e4dc', '#b9ae9c', '#5b5347', '#1c1a17'],
  ['#ffd9a0', '#ff8a5c', '#a3324f', '#2b0f2e'],
  ['#b9d7ff', '#7b8fe8', '#3a2f8f', '#120f33'],
  ['#e6f5a8', '#a7c957', '#386641', '#10231a'],
];

function rng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function photo(n, w, h) {
  const r = rng(n + 11);
  const p = PALETTES[n % PALETTES.length];
  const horizon = 0.5 + r() * 0.25;
  const sunX = 0.2 + r() * 0.6;
  const sunY = horizon - 0.12 - r() * 0.2;
  const figureX = 0.3 + r() * 0.4;
  const figureH = 0.34 + r() * 0.16;
  const fw = w * 0.11;
  const fh = h * figureH;
  const fx = w * figureX;
  const fy = h * (horizon + 0.2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[1]}"/><stop offset="${horizon.toFixed(2)}" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="${p[0]}" stop-opacity=".7"/><stop offset="1" stop-color="${p[0]}" stop-opacity="0"/></radialGradient>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[2]}"/><stop offset="1" stop-color="${p[3]}"/></linearGradient>
<filter id="soft"><feGaussianBlur stdDeviation="${Math.round(w / 90)}"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>
<circle cx="${(w * sunX).toFixed(0)}" cy="${(h * sunY).toFixed(0)}" r="${(w * 0.42).toFixed(0)}" fill="url(#sun)"/>
<path d="M0 ${(h * horizon).toFixed(0)} C ${(w * 0.25).toFixed(0)} ${(h * (horizon - 0.06)).toFixed(0)}, ${(w * 0.6).toFixed(0)} ${(h * (horizon + 0.05)).toFixed(0)}, ${w} ${(h * (horizon - 0.03)).toFixed(0)} L ${w} ${h} L 0 ${h} Z" fill="url(#ground)" opacity=".92"/>
<g filter="url(#soft)" fill="${p[3]}" opacity=".88">
<ellipse cx="${fx.toFixed(0)}" cy="${(fy - fh).toFixed(0)}" rx="${(fw * 0.42).toFixed(0)}" ry="${(fw * 0.5).toFixed(0)}"/>
<path d="M ${(fx - fw * 0.75).toFixed(0)} ${fy.toFixed(0)} Q ${fx.toFixed(0)} ${(fy - fh * 1.05).toFixed(0)} ${(fx + fw * 0.75).toFixed(0)} ${fy.toFixed(0)} Z"/>
</g>
<rect width="${w}" height="${h}" fill="${p[3]}" opacity=".08"/>
</svg>`;
}

function face(n) {
  const p = PALETTES[(n * 3) % PALETTES.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs>
<rect width="600" height="600" fill="url(#bg)"/>
<circle cx="300" cy="250" r="105" fill="${p[3]}" opacity=".82"/>
<path d="M90 600 Q 300 330 510 600 Z" fill="${p[3]}" opacity=".82"/>
</svg>`;
}

/** The SVG for a seed picture name. Unknown names still get a picture. */
export function seedImage(name) {
  const faceMatch = /face-(\d+)/.exec(name);
  if (faceMatch) return face(Number(faceMatch[1]));
  const match = /photo-(\d+)(?:-(\d+)x(\d+))?/.exec(name);
  const n = match ? Number(match[1]) : 1;
  const w = match?.[2] ? Number(match[2]) : 900;
  const h = match?.[3] ? Number(match[3]) : 1200;
  return photo(n, w, h);
}
