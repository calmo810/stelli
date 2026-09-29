import React from 'react';
import { slugify } from '@/lib/wizardData';

export default function StepName({ w }) {
  return (
    <>
      <div className="field">
        <label className="lbl" htmlFor="fName">
          Display name
        </label>
        <input
          id="fName"
          className="inp"
          value={w.s.name}
          maxLength={40}
          placeholder="e.g. Maya"
          autoComplete="given-name"
          onChange={(event) => w.patch({ name: event.target.value, slug: slugify(event.target.value) })}
        />
      </div>

      <div className="field">
        <span className="lbl">Your link</span>
        <div className="link-preview">
          <span className="u">
            {window.location.host}/creators/<b>{w.s.slug || 'your-name'}</b>
          </span>
        </div>
        <p className="hint">This is what you'll drop in your Instagram bio once you're live.</p>
      </div>
    </>
  );
}