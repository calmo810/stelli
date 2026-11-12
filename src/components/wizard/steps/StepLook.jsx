import React from 'react';
import { ACCENTS, CURVES, FRAMES, LAYOUTS, MATS } from '@/lib/creatorProfile';

const CAPTIONS = [
  { v: true, l: 'On' },
  { v: false, l: 'Off' },
];

function Segmented({ options, value, onPick, label, disabled = false }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label} style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
      {options.map((option) => (
        <button
          key={String(option.v)}
          type="button"
          className={value === option.v ? 'on' : ''}
          role="radio"
          aria-checked={value === option.v}
          onClick={() => onPick(option.v)}
        >
          {option.sw && <span className="swatch" style={{ background: option.sw, boxShadow: 'inset 0 0 0 1px var(--line-2)' }} />}
          {option.l}
        </button>
      ))}
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div className="seg-group">
      <span className="lbl">{label}</span>
      <br />
      {children}
    </div>
  );
}

/**
 * How the creator's work hangs on their public page. Only the creator sets
 * this; clients see the page exactly as it is left here.
 */
export default function StepLook({ w }) {
  const s = w.s;
  return (
    <>
      <Group label="Layout">
        <Segmented label="Layout" options={LAYOUTS} value={s.layout} onPick={(layout) => w.patch({ layout })} />
      </Group>
      <Group label="Curve">
        <Segmented label="Curve" options={CURVES} value={s.curve} onPick={(curve) => w.patch({ curve })} disabled={s.layout === 'grid'} />
      </Group>
      <Group label="Frame">
        <Segmented label="Frame" options={FRAMES} value={s.frame} onPick={(frame) => w.patch({ frame })} />
      </Group>
      <Group label="Mat colour">
        <Segmented label="Mat colour" options={MATS} value={s.mat} onPick={(mat) => w.patch({ mat })} disabled={s.frame === 'bleed'} />
      </Group>
      <Group label="Accent">
        <Segmented label="Accent" options={ACCENTS} value={s.accent} onPick={(accent) => w.patch({ accent })} />
      </Group>
      <Group label="Captions">
        <Segmented label="Captions" options={CAPTIONS} value={s.captions} onPick={(captions) => w.patch({ captions })} />
      </Group>
      <div className="look-note">
        <span className="pulse" />
        Every photo becomes the same print, so your page looks even with 3 photos or 12. Watch the preview as you tap.
      </div>
    </>
  );
}
