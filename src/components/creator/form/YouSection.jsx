import React, { useRef } from 'react';
import { UserRound } from 'lucide-react';
import { LIMITS, slugify } from '@/lib/creatorProfile';
import { Field } from './Field';

/** Who the client is booking: a face and a name. */
export default function YouSection({ form, set, uploads, slug = '' }) {
  const input = useRef(null);
  // A live page keeps its link when the name changes; a new one gets it from the name.
  const link = slug || slugify(form.name) || 'your-name';

  return (
    <div className="cf-stack">
      <div className="cf-face">
        <span className="cf-face__img">
          {form.photo ? <img src={form.photo} alt="Your profile photo" /> : <UserRound className="h-9 w-9" />}
        </span>
        <div>
          <button
            type="button"
            className="wk-btn wk-btn--ghost"
            onClick={() => input.current?.click()}
            disabled={uploads.uploading}
          >
            {uploads.uploading ? 'Uploading…' : form.photo ? 'Replace photo' : 'Choose a photo of you'}
          </button>
          <p className="cf-hint">A clear, recent photo of you. Not your best landscape.</p>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*,.heic,.heif"
          hidden
          onChange={(event) => {
            uploads.uploadPhoto(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>

      <Field label="Display name" htmlFor="cfName" hint={`Your link: getstelli.com/creators/${link}`}>
        <input
          id="cfName"
          className="cf-input"
          value={form.name}
          maxLength={LIMITS.name}
          placeholder="First name is fine"
          autoComplete="given-name"
          onChange={(event) => set({ name: event.target.value })}
        />
      </Field>
    </div>
  );
}
