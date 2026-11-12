import React, { useMemo } from 'react';
import PrintWall from '@/components/profile/PrintWall';
import { accentColor, printLabel } from '@/lib/profilePresets';
import { LOOK_OPTIONS, orderedPortfolio } from '@/lib/creatorProfile';
import { Field, Segmented } from './Field';

/**
 * How the creator's work hangs on their public page, next to the real thing:
 * the preview is the same wall the public page draws, with their own photos.
 */
export default function LookSection({ form, set }) {
  const sources = orderedPortfolio(form).map((item) => item.src).join('|');
  const photos = useMemo(() => (sources ? sources.split('|').map((src) => ({ src })) : []), [sources]);
  const settings = useMemo(
    () => ({ layout: form.layout, curve: form.curve, frame: form.frame, mat: form.mat, captions: form.captions }),
    [form.layout, form.curve, form.frame, form.mat, form.captions]
  );
  const label = useMemo(() => printLabel(form.name.trim() || 'Your Name'), [form.name]);

  return (
    <div className="cf-look">
      <div className="cf-stack">
        <Field label="Layout">
          <Segmented label="Layout" options={LOOK_OPTIONS.layout} value={form.layout} onPick={(layout) => set({ layout })} />
        </Field>
        <Field label="Curve">
          <Segmented
            label="Curve"
            options={LOOK_OPTIONS.curve}
            value={form.curve}
            onPick={(curve) => set({ curve })}
            disabled={form.layout === 'grid'}
          />
        </Field>
        <Field label="Frame">
          <Segmented label="Frame" options={LOOK_OPTIONS.frame} value={form.frame} onPick={(frame) => set({ frame })} />
        </Field>
        <Field label="Mat colour">
          <Segmented
            label="Mat colour"
            options={LOOK_OPTIONS.mat}
            value={form.mat}
            onPick={(mat) => set({ mat })}
            disabled={form.frame === 'bleed'}
          />
        </Field>
        <Field label="Accent">
          <Segmented label="Accent" options={LOOK_OPTIONS.accent} value={form.accent} onPick={(accent) => set({ accent })} />
        </Field>
        <Field label="Captions">
          <Segmented
            label="Captions"
            options={LOOK_OPTIONS.captions}
            value={form.captions}
            onPick={(captions) => set({ captions })}
          />
        </Field>
      </div>

      <div>
        <p className="cf-label">
          <span>On your page</span>
        </p>
        {photos.length ? (
          <div className="cf-look__wall">
            <PrintWall compact photos={photos} settings={settings} label={label} accent={accentColor(form.accent)} name="Your" />
          </div>
        ) : (
          <p className="cf-hint">Add photos to your portfolio to see them hang here.</p>
        )}
      </div>
    </div>
  );
}
