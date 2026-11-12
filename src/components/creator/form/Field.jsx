import React from 'react';

/** A labelled field. `note` sits on the right of the label (a count, "optional"). */
export function Field({ label, note = '', hint = '', htmlFor = undefined, children }) {
  return (
    <div>
      <label className="cf-label" htmlFor={htmlFor}>
        <span>{label}</span>
        {note && <small>{note}</small>}
      </label>
      {children}
      {hint && <p className="cf-hint">{hint}</p>}
    </div>
  );
}

/** Tap-to-toggle chips for a list of choices. */
export function ChipPicker({ options, picked, onChange, small = false }) {
  const toggle = (option) =>
    onChange(picked.includes(option) ? picked.filter((item) => item !== option) : [...picked, option]);
  return (
    <div className="cf-chips">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`cf-chip ${small ? 'cf-chip--small' : ''} ${picked.includes(option) ? 'is-on' : ''}`}
          aria-pressed={picked.includes(option)}
          onClick={() => toggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/** One choice out of a few, as a row of pills. */
export function Segmented({ label, options, value, onPick, disabled = false }) {
  return (
    <div className={`cf-seg ${disabled ? 'is-off' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.v)}
          type="button"
          role="radio"
          aria-checked={value === option.v}
          className={value === option.v ? 'is-on' : ''}
          onClick={() => onPick(option.v)}
        >
          {option.sw && <i style={{ background: option.sw }} />}
          {option.l}
        </button>
      ))}
    </div>
  );
}
