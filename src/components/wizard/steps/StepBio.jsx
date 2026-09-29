import React from 'react';

export default function StepBio({ w }) {
  return (
    <div className="field">
      <div className="lbl-line">
        <label className="lbl" htmlFor="fBio">
          Bio
        </label>
        <span className={`count ${w.s.bio.length > 250 ? 'near' : ''}`}>{w.s.bio.length}/280</span>
      </div>
      <textarea
        id="fBio"
        className="inp"
        maxLength={280}
        value={w.s.bio}
        placeholder="I keep sessions relaxed and direct just enough that you never feel stiff."
        onChange={(event) => w.patch({ bio: event.target.value })}
      />
      <p className="hint">Write it like you'd say it. Skip the résumé voice.</p>
    </div>
  );
}