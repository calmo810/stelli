import React from 'react';

export default function StyleTagChips({ tags = [], accent, className = '' }) {
  if (!tags.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="label-mono text-[9px] px-3 py-1.5 border"
          style={{ borderColor: accent, color: accent, borderRadius: 999 }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}