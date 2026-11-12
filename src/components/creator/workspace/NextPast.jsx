import React from 'react';

/** Next / Past: the one switch that keeps every creator list short. */
export default function NextPast({ value, onChange, nextCount, pastCount }) {
  return (
    <div className="wk-seg" role="tablist" aria-label="Next or past">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'next'}
        onClick={() => onChange('next')}
        className={`wk-seg-btn ${value === 'next' ? 'is-on' : ''}`}
      >
        Next
        {typeof nextCount === 'number' && <span className="wk-seg-n">{nextCount}</span>}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'past'}
        onClick={() => onChange('past')}
        className={`wk-seg-btn ${value === 'past' ? 'is-on' : ''}`}
      >
        Past
        {typeof pastCount === 'number' && <span className="wk-seg-n">{pastCount}</span>}
      </button>
    </div>
  );
}