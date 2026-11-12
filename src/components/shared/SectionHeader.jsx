import React from 'react';

const SIZES = { hero: 'st-display', section: 'st-h1', small: 'st-h2' };

/** The one header shape: quiet kicker, big statement, short line under it. */
/** @param {Record<string, any>} props */
export default function SectionHeader({ eyebrow, title, intro, align = 'left', size = 'hero', level = 'h1', action }) {
  const Tag = level;
  const centered = align === 'center';

  return (
    <header className={centered ? 'text-center' : ''}>
      {eyebrow && <p className="st-kicker mb-3">{eyebrow}</p>}
      <Tag className={SIZES[size] || SIZES.hero}>{title}</Tag>
      {(intro || action) && (
        <div className={`mt-5 flex flex-col gap-5 ${centered ? 'items-center' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
          {intro && <p className={`st-lede ${centered ? 'mx-auto' : ''}`}>{intro}</p>}
          {action}
        </div>
      )}
    </header>
  );
}
