import React from 'react';

const LAYOUTS = [
  { v: 'wall', l: 'Wall' },
  { v: 'strip', l: 'Strip' },
  { v: 'grid', l: 'Grid' },
];
const CURVES = [
  { v: 'flat', l: 'Flat' },
  { v: 'soft', l: 'Soft' },
  { v: 'full', l: 'Full' },
];
const FRAMES = [
  { v: 'mat', l: 'Mat' },
  { v: 'bleed', l: 'Full bleed' },
];
const MATS = [
  { v: 'mixed', l: 'Mixed', sw: 'conic-gradient(#cfe6fb 0 25%, #fbdde4 0 50%, #e2defa 0 75%, #dcf5dc 0)' },
  { v: 'paper', l: 'Paper', sw: '#f2f1ec' },
  { v: 'sky', l: 'Sky', sw: '#cfe6fb' },
  { v: 'blush', l: 'Blush', sw: '#fbdde4' },
  { v: 'lilac', l: 'Lilac', sw: '#e2defa' },
  { v: 'mint', l: 'Mint', sw: '#dcf5dc' },
  { v: 'ink', l: 'Ink', sw: '#1b2238' },
];
const ACCENTS = [
  { v: 'lime', l: 'Lime', sw: '#C4F82A' },
  { v: 'cyan', l: 'Cyan', sw: '#2AE8F8' },
  { v: 'magenta', l: 'Magenta', sw: '#F82AC4' },
];
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
          {option.sw && <span className="swatch" style={{ background: option.sw, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.2)' }} />}
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
