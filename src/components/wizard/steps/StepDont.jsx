import React from 'react';

export default function StepDont({ w }) {
  return (
    <div className="field">
      <div className="lbl-line">
        <label className="lbl" htmlFor="fDont">
          What I don't shoot
        </label>
        <span className="count">{w.s.dont.length}/140</span>
      </div>
      <textarea
        id="fDont"
        className="inp"
        maxLength={140}
        style={{ minHeight: 90 }}
        value={w.s.dont}
        placeholder="No weddings or newborns. Ask me about your dog though."
        onChange={(event) => w.patch({ dont: event.target.value })}
      />
    </div>
  );
}