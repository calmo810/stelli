import React from 'react';
import { HOT_SPOTS, SPOTS } from '@/lib/wizardData';

export default function StepWhere({ w }) {
  const picked = w.s.where;
  const toggle = (spot) => {
    w.patch({ where: picked.includes(spot) ? picked.filter((item) => item !== spot) : [...picked, spot] });
  };

  return (
    <>
      <div className="chips">
        {SPOTS.map((spot) => (
          <button
            key={spot}
            type="button"
            className={`chip ${picked.includes(spot) ? 'on' : ''}`}
            aria-pressed={picked.includes(spot)}
            onClick={() => toggle(spot)}
          >
            {HOT_SPOTS[spot] && <span className="chip-hot">{HOT_SPOTS[spot]}</span>}
            {spot}
          </button>
        ))}
      </div>
      <div className="picked">
        {picked.length ? (
          <>
            <b>
              {picked.length} spot{picked.length > 1 ? 's' : ''}
            </b>{' '}
            picked
          </>
        ) : (
          'Pick at least one'
        )}
      </div>
    </>
  );
}