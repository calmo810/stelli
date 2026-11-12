import React from 'react';
import { SHOOTS, SPOTS } from '@/lib/creatorProfile';
import { ChipPicker, Field } from './Field';

/** What they shoot (needed) and where on campus (optional). */
export default function WorkSection({ form, set }) {
  return (
    <div className="cf-stack">
      <Field label="What you shoot" note={form.what.length ? `${form.what.length} picked` : 'Pick at least one'}>
        <ChipPicker options={SHOOTS} picked={form.what} onChange={(what) => set({ what })} />
      </Field>

      <Field
        label="Where on campus"
        note="Optional"
        hint={form.where.length ? '' : "None picked: we'll list you as anywhere on campus."}
      >
        <ChipPicker options={SPOTS} picked={form.where} onChange={(where) => set({ where })} small />
      </Field>
    </div>
  );
}
