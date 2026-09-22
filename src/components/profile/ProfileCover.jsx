import React from 'react';

const DEFAULT_RATIO = 'aspect-[4/5] sm:aspect-[3/2]';

export default function ProfileCover({ src, focal, ratioClass = DEFAULT_RATIO }) {
  if (!src) {
    return <div className={`w-full ${ratioClass} bg-surface-2`} />;
  }

  return (
    <div className={`relative w-full ${ratioClass} overflow-hidden bg-surface-2`}>
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: `${focal?.x ?? 50}% ${focal?.y ?? 50}%` }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, hsl(var(--ink)) 0%, rgba(10,18,38,0.3) 45%, transparent 75%)' }}
      />
    </div>
  );
}