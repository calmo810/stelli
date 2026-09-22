import React from 'react';

export default function LimitedTextField({
  label, value, onChange, limit, placeholder, error, hint, multiline = false, rows = 3,
}) {
  const count = (value || '').length;
  const shared = {
    value: value || '',
    onChange: (e) => onChange(e.target.value),
    placeholder,
    maxLength: limit,
    className:
      'w-full border bg-white/[0.03] px-4 py-3 font-body text-[13px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-neon-lime',
    style: { borderColor: error ? 'hsl(var(--neon-magenta))' : 'rgba(255,255,255,0.1)', borderRadius: 4 },
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="label-mono text-[9px] text-white/40">{label}</span>
        <span className="label-mono text-[9px] text-white/25">{count}/{limit}</span>
      </div>
      {multiline ? <textarea rows={rows} {...shared} /> : <input {...shared} />}
      {error ? (
        <p className="font-body text-[11px] leading-relaxed mt-2" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {error}
        </p>
      ) : hint ? (
        <p className="font-body text-[11px] leading-relaxed text-white/30 mt-2">{hint}</p>
      ) : null}
    </div>
  );
}