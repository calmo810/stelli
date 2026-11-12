import React from 'react';
import { LIMITS } from '@/lib/creatorProfile';

export default function StepDont({ w }) {
  return (
    <div className="field">
      <div className="lbl-line">
        <label className="lbl" htmlFor="fDont">
          What I don't shoot
        </label>
        <span className="count">{w.s.dont.length}/{LIMITS.dont_shoot}</span>
      </div>
      <textarea
        id="fDont"
        className="inp"
        maxLength={LIMITS.dont_shoot}
        style={{ minHeight: 90 }}
        value={w.s.dont}
        placeholder="No weddings or newborns. Ask me about your dog though."
        onChange={(event) => w.patch({ dont: event.target.value })}
      />
    </div>
  );
}