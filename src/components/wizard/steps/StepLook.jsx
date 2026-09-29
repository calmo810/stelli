import React from 'react';

const THEMES = [
  { v: 'night', l: 'Night Flash' },
  { v: 'clean', l: 'Clean' },
];
const ACCENTS = [
  { v: 'lime', l: 'Lime', sw: '#d6f344' },
  { v: 'cyan', l: 'Cyan', sw: '#4fd8e0' },
  { v: 'magenta', l: 'Magenta', sw: '#e356c4' },
];
const GALLERIES = [
  { v: 'hero', l: 'Hero Grid' },
  { v: 'ordered', l: 'Ordered' },
  { v: 'contact', l: 'Contact Sheet' },
];

function Segmented({ options, value, onPick }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.v}
          type="button"
          className={value === option.v ? 'on' : ''}
          role="radio"
          aria-checked={value === option.v}
          onClick={() => onPick(option.v)}
        >
          {option.sw && <span className="swatch" style={{ background: option.sw }} />}
          {option.l}
        </button>
      ))}
    </div>
  );
}

export default function StepLook({ w }) {
  return (
    <>
      <div className="seg-group">
        <span className="lbl">Theme</span>
        <br />
        <Segmented options={THEMES} value={w.s.theme} onPick={(theme) => w.patch({ theme })} />
      </div>
      <div className="seg-group">
        <span className="lbl">Accent</span>
        <br />
        <Segmented options={ACCENTS} value={w.s.accent} onPick={(accent) => w.patch({ accent })} />
      </div>
      <div className="seg-group">
        <span className="lbl">Gallery</span>
        <br />
        <Segmented options={GALLERIES} value={w.s.gallery} onPick={(gallery) => w.patch({ gallery })} />
      </div>
      <div className="look-note">
        <span className="pulse" />
        Every tap re-skins your live preview instantly.
      </div>
    </>
  );
}