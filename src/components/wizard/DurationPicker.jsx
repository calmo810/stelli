import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { DURATIONS } from '@/lib/wizardData';

/**
 * Length picker for a package: the field opens a dark sheet of every duration
 * instead of the browser's own option list.
 */
export default function DurationPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const pick = (duration) => {
    onChange(duration);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="inp dur-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className={value ? '' : 'dur-empty'}>{value || 'Choose'}</span>
        <ChevronDown size={16} aria-hidden />
      </button>

      {open && (
        <div className="pick-back" onClick={() => setOpen(false)}>
          <div
            className="pick-card"
            role="dialog"
            aria-modal="true"
            aria-label="Choose a length"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pick-head">
              <span className="lbl">Shoot length</span>
              <button type="button" className="pick-x" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="pick-list" role="listbox" aria-label="Shoot length">
              {DURATIONS.map((duration) => {
                const on = duration === value;
                return (
                  <button
                    key={duration}
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={`pick-opt ${on ? 'on' : ''}`}
                    onClick={() => pick(duration)}
                  >
                    <span>{duration}</span>
                    {on && <Check size={16} aria-hidden />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}