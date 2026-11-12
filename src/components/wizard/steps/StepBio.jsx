import React from 'react';
import { LIMITS } from '@/lib/creatorProfile';

export default function StepBio({ w }) {
  return (
    <div className="field">
      <div className="lbl-line">
        <label className="lbl" htmlFor="fBio">
          Bio
        </label>
        <span className={`count ${w.s.bio.length > LIMITS.bio - 40 ? 'near' : ''}`}>{w.s.bio.length}/{LIMITS.bio}</span>
      </div>
      <textarea
        id="fBio"
        className="inp"
        maxLength={LIMITS.bio}
        value={w.s.bio}
        placeholder="I keep sessions relaxed and direct just enough that you never feel stiff."
        onChange={(event) => w.patch({ bio: event.target.value })}
      />
      <p className="hint">Write it like you'd say it. Skip the résumé voice.</p>
    </div>
  );
}