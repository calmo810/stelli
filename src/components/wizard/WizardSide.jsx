import React from 'react';
import WizardPhone from './WizardPhone';
import WizardProfilePreview from './WizardProfilePreview';

/** The live preview rail, with how far the profile is from being sendable. */
export default function WizardSide({ w }) {
  const left = w.missing.length;
  return (
    <aside className="side">
      <div className="side-head">
        <span className="lbl">
          <span className="pulse" />
          Live preview
        </span>
        <button type="button" className="link-btn" onClick={() => w.setView('preview')}>
          Full preview
        </button>
      </div>

      <WizardPhone>
        <WizardProfilePreview s={w.s} />
      </WizardPhone>

      <div className="side-foot">
        <span className="ready-pill">
          <span className="ring" style={{ '--p': w.pct }} />
          {left === 0
            ? w.applying ? 'Ready to send' : 'Ready to save'
            : `${left} thing${left > 1 ? 's' : ''} left${w.applying ? ' to apply' : ''}`}
        </span>
      </div>
    </aside>
  );
}