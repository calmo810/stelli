import React from 'react';

/**
 * A fixed list of options as tappable chips. Never a dropdown.
 */
export default function ChipPicker({ id, label, hint, options, values, onChange, error }) {
  const selected = values || [];

  const toggle = (option) => {
    onChange(selected.includes(option) ? selected.filter((v) => v !== option) : [...selected, option]);
  };

  return (
    <div id={id}>
      <span className="block label-mono text-[10px] text-white/40 mb-2.5">{label}</span>
      {hint && <span className="block font-body text-[11px] text-white/50 mb-3">{hint}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={active}
              className="px-3.5 py-2 font-body text-[12px] border transition-colors"
              style={{
                borderRadius: 999,
                borderColor: active ? 'hsl(var(--neon-cyan))' : 'rgba(255,255,255,0.15)',
                color: active ? 'hsl(var(--neon-cyan))' : 'rgba(255,255,255,0.6)',
                background: active ? 'hsl(var(--neon-cyan) / 0.1)' : 'transparent',
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error && (
        <span className="block font-body text-[11px] mt-2" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {error}
        </span>
      )}
    </div>
  );
}