import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const EASE = 'cubic-bezier(.6,0,.2,1)';

/** Segmented filter with a lime pill that slides under the active choice. */
export default function BrowseFilters({ filters, value, onChange, count = 0 }) {
  const rowRef = useRef(null);
  const buttons = useRef({});
  const shownRef = useRef(count);
  const [pill, setPill] = useState({ left: 5, width: 0 });
  const [shown, setShown] = useState(count);

  const movePill = useCallback(() => {
    const button = buttons.current[value];
    if (!button) return;
    setPill({ left: button.offsetLeft, width: button.offsetWidth });
  }, [value]);

  useLayoutEffect(() => {
    movePill();
  }, [movePill, filters.length]);

  useEffect(() => {
    const observer = new ResizeObserver(movePill);
    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [movePill]);

  // Count up to the new total so the number never just jumps.
  useEffect(() => {
    const from = shownRef.current;
    shownRef.current = count;
    const start = performance.now();
    let frame;
    const step = (now) => {
      const p = Math.min(1, (now - start) / 400);
      setShown(Math.round(from + (count - from) * p));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [count]);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <div
        ref={rowRef}
        role="group"
        aria-label="Filter creators"
        className="relative inline-flex max-w-full overflow-x-auto rounded-full border border-white/10 bg-surface p-[5px] no-scrollbar"
      >
        <span
          aria-hidden="true"
          className="absolute top-[5px] bottom-[5px] rounded-full bg-neon-lime"
          style={{
            left: pill.left,
            width: pill.width,
            transition: `left .5s ${EASE}, width .5s ${EASE}`,
          }}
        />
        {filters.map((filter) => (
          <button
            key={filter.id}
            ref={(node) => {
              buttons.current[filter.id] = node;
            }}
            type="button"
            aria-pressed={value === filter.id}
            onClick={() => value !== filter.id && onChange(filter.id)}
            className="relative z-[1] whitespace-nowrap rounded-full px-[18px] py-2.5 text-[14px] font-medium transition-colors duration-300"
            style={{ color: value === filter.id ? 'hsl(var(--ink))' : 'rgba(255,255,255,0.55)' }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <p className="text-[14px] text-white/45 tabular-nums" aria-live="polite">
        <b className="font-semibold text-white">{shown}</b> creator{shown === 1 ? '' : 's'} available
      </p>
    </div>
  );
}