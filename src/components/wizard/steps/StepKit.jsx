import React from 'react';

export default function StepKit({ w }) {
  return (
    <div className="inp-row">
      <div className="field" style={{ flex: 2.4 }}>
        <label className="lbl" htmlFor="fEquip">
          Equipment
        </label>
        <input
          id="fEquip"
          className="inp"
          maxLength={80}
          value={w.s.equip}
          placeholder="Sony A7IV, 35mm, one flash"
          autoComplete="off"
          onChange={(event) => w.patch({ equip: event.target.value })}
        />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="fYears">
          Years shooting
        </label>
        <input
          id="fYears"
          className="inp"
          inputMode="numeric"
          maxLength={2}
          value={w.s.years}
          placeholder="3"
          autoComplete="off"
          onChange={(event) => w.patch({ years: event.target.value.replace(/\D/g, '') })}
        />
      </div>
    </div>
  );
}