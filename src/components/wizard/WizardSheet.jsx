import React from 'react';
import WizardProfilePreview from './WizardProfilePreview';

/** The live preview as a sheet, for screens without the side rail. */
export default function WizardSheet({ w }) {
  return (
    <>
      <div className="sheet-back" onClick={() => w.setSheetOpen(false)} />
      <div className="sheet" role="dialog" aria-label="Live preview">
        <div className="sheet-grab">
          <span className="lbl">Live preview</span>
          <button type="button" className="link-btn" onClick={() => w.setSheetOpen(false)}>
            Done
          </button>
        </div>
        <WizardProfilePreview s={w.s} />
      </div>
    </>
  );
}