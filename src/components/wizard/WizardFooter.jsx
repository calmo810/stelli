import React from 'react';
import { REQS } from '@/lib/wizardData';

/** The wizard's action bar: back, what is still needed, and the way forward. */
export default function WizardFooter({ w }) {
  const meta = w.steps[w.step];
  const unmet = REQS.find((r) => r.k === meta.key && !r.ok(w.s));
  const last = w.step === w.steps.length - 1;
  const busy = w.publishing || w.uploading;

  let forward = 'Continue';
  if (last) forward = w.applying ? (w.publishing ? 'Sending…' : 'Send application') : 'Review my page';

  return (
    <div className="foot">
      <div className="foot-in">
        <button type="button" className="back" onClick={w.goBack}>
          {w.step === 0 ? 'Home' : '← Back'}
        </button>

        <span className="hint">
          {w.uploading ? w.uploadNote || 'Uploading…' : unmet ? `Still needed: ${unmet.t.toLowerCase()}` : 'Press Enter ↵ to continue'}
        </span>

        {meta.optional && (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => (last ? w.setView('preview') : w.goStep(w.step + 1))}
          >
            Skip
          </button>
        )}

        <button type="button" className="go" onClick={w.goNext} disabled={busy}>
          {forward}
        </button>
      </div>
    </div>
  );
}
