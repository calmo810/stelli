import React from 'react';
import { ACCENTS, accentColor } from '@/lib/profilePresets';

export default function AccentPicker({ value, onChange }) {
  return (
    <div>
      <p className="label-mono text-[9px] text-white/40 mb-2">Accent</p>
      <div className="flex gap-3">
        {ACCENTS.map((accent) => {
          const active = (value || 'lime') === accent.id;
          return (
            <button
              key={accent.id}
              onClick={() => onChange(accent.id)}
              className="flex items-center gap-2 px-3 py-2 border transition-colors duration-200"
              style={{
                borderColor: active ? accentColor(accent.id) : 'rgba(255,255,255,0.12)',
                borderRadius: 4,
              }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: accentColor(accent.id), opacity: active ? 1 : 0.45 }}
              />
              <span
                className="label-mono text-[9px]"
                style={{ color: active ? accentColor(accent.id) : 'rgba(255,255,255,0.5)' }}
              >
                {accent.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}