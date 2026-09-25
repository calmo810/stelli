import React from 'react';

const SIZES = {
  hero: 'clamp(38px, 7vw, 84px)',
  section: 'clamp(28px, 4.4vw, 54px)',
  small: 'clamp(22px, 2.6vw, 32px)',
};

/** The one header shape: quiet eyebrow, big statement, short line under it. */
export default function SectionHeader({
  eyebrow,
  title,
  intro,
  align = 'left',
  size = 'hero',
  level = 'h1',
  action,
}) {
  const Tag = level;
  const centered = align === 'center';

  return (
    <header className={centered ? 'text-center' : ''}>
      {eyebrow && <p className="label-mono text-[10px] text-white/40 mb-5">{eyebrow}</p>}

      <Tag
        className="font-semibold leading-[0.98] tracking-[-0.02em] text-white"
        style={{ fontSize: SIZES[size] }}
      >
        {title}
      </Tag>

      {(intro || action) && (
        <div
          className={`mt-6 flex flex-col gap-6 ${
            centered
              ? 'items-center'
              : 'md:flex-row md:items-end md:justify-between'
          }`}
        >
          {intro && (
            <p className={`text-[15px] leading-relaxed text-white/45 ${centered ? 'max-w-[520px]' : 'max-w-[460px]'}`}>
              {intro}
            </p>
          )}
          {action}
        </div>
      )}
    </header>
  );
}