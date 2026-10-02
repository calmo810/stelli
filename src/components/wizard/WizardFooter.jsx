import React from 'react';
import { REQS, STEPS } from '@/lib/wizardData';

/** The wizard's action bar: back, what is still needed, and the way forward. */
export default function WizardFooter({ w }) {
  const meta = STEPS[w.step];
  const req = REQS.find((r) => r.k === meta.key);
  const missing = req && !req.ok(w.s) ? req.t : '';
  const last = w.step === STEPS.length - 1;
  const skipLabel = meta.need ? 'Add later' : meta.optional ? 'Skip' : '';

  return (
    <div className="foot">
      <div className="foot-in">
        <button type="button" className="back" onClick={w.goBack}>
          {w.step === 0 ? 'Home' : '← Back'}
        </button>

        <span className="hint">{missing || 'Press Enter ↵ to continue'}</span>

        {skipLabel && (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => (last ? w.setView('preview') : w.goStep(w.step + 1))}
          >
            {skipLabel}
          </button>
        )}

        <button type="button" className="go" onClick={w.goNext} disabled={w.publishing}>
          {last ? 'Review my page' : 'Continue'}
        </button>
      </div>
    </div>
  );
}