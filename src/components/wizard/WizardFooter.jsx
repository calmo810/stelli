import React from 'react';
import { STEPS } from '@/lib/wizardData';
import { REQS } from '@/lib/creatorProfile';

/** The wizard's action bar: back, what is still needed, and the way forward. */
export default function WizardFooter({ w }) {
  const meta = STEPS[w.step];
  const req = REQS.find((r) => r.k === meta.key);
  const missing = req && !req.ok(w.s) ? req.t : '';
  // The last step of the route, or an extra opened from the review.
  const last = w.pos < 0 || w.pos === w.flow.length - 1;
  // An extra opened from the review has nothing to skip to: "Done" takes it back.
  const skipLabel = w.pos < 0 ? '' : meta.need ? 'Add later' : meta.optional ? 'Skip' : '';

  return (
    <div className="foot">
      <div className="foot-in">
        <button type="button" className="back" onClick={w.goBack}>
          {w.pos > 0 ? '← Back' : w.existing || w.pos < 0 ? '← Review' : '← Exit'}
        </button>

        <span className="hint">{missing || 'Press Enter ↵ to continue'}</span>

        {skipLabel && (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={w.skip}
          >
            {skipLabel}
          </button>
        )}

        <button type="button" className="go" onClick={w.goNext} disabled={w.publishing}>
          {last ? (w.pos < 0 ? 'Done' : 'Review my page') : 'Continue'}
        </button>
      </div>
    </div>
  );
}