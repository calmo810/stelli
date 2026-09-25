import React from 'react';

/** Glass segmented control with a sliding thumb. */
export default function SegmentedTabs({ value, onChange, options, className = '' }) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));

  return (
    <div
      role="tablist"
      className={`glass relative grid rounded-[980px] p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 rounded-[980px] transition-transform duration-[450ms] ease-out"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
          background: 'rgba(255,255,255,0.18)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
      />

      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`relative z-[1] rounded-[980px] py-2.5 text-[13px] font-medium transition-colors min-[420px]:text-[14px] ${
              active ? 'text-white' : 'text-white/65'
            }`}
          >
            {option.label}
            {typeof option.count === 'number' && (
              <span className="ml-1 hidden text-[12px] text-white/45 min-[420px]:inline">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}