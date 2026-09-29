import React from 'react';
import { HOT_SHOOTS, SHOOTS } from '@/lib/wizardData';

export default function StepWhat({ w }) {
  const picked = w.s.what;
  const toggle = (shoot) => {
    w.patch({ what: picked.includes(shoot) ? picked.filter((item) => item !== shoot) : [...picked, shoot] });
  };

  return (
    <>
      <div className="chips">
        {SHOOTS.map((shoot) => (
          <button
            key={shoot}
            type="button"
            className={`chip ${picked.includes(shoot) ? 'on' : ''}`}
            aria-pressed={picked.includes(shoot)}
            onClick={() => toggle(shoot)}
          >
            {HOT_SHOOTS[shoot] && <span className="chip-hot">{HOT_SHOOTS[shoot]}</span>}
            {shoot}
          </button>
        ))}
      </div>
      <div className="picked">
        {picked.length ? (
          <>
            <b>{picked.length}</b> selected
          </>
        ) : (
          'Pick at least one'
        )}
      </div>
    </>
  );
}