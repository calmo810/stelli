import React from 'react';

export default function PresetPicker({ label, value, options, onChange }) {
  return (
    <div>
      <p className="label-mono text-[9px] text-white/40 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className="label-mono text-[9px] px-3 py-2 border transition-colors duration-200"
              style={{
                borderColor: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.12)',
                color: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.5)',
                borderRadius: 4,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}