import React from 'react';
import { tagsForMarket } from '@/lib/profilePresets';

export default function TagPicker({ tags = [], onChange }) {
  const options = tagsForMarket();

  const toggle = (tag) => {
    if (tags.includes(tag)) {
      onChange(tags.filter((t) => t !== tag));
      return;
    }
    // A fourth selection replaces the oldest.
    onChange([...tags, tag].slice(-3));
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <p className="label-mono text-[9px] text-white/40">Style tags</p>
        <p className="label-mono text-[9px] text-white/25">{tags.length}/3</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const active = tags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className="label-mono text-[9px] px-3 py-2 border transition-colors duration-200"
              style={{
                borderColor: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.12)',
                color: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.5)',
                borderRadius: 999,
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}