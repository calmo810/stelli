import React from 'react';
import { REQS } from '@/lib/wizardData';

/**
 * The wizard's action bar.
 *
 * Applying (or sending a page back after a founder's note) it walks forward:
 * Continue, then send. Editing a page from the portal it is one section at a
 * time: Save puts the change live and returns to the portal.
 */
export default function WizardFooter({ w }) {
  const meta = w.steps[w.step];
  const unmet = REQS.find((r) => r.k === meta.key && !r.ok(w.s));
  const last = w.step === w.steps.length - 1;
  const busy = w.publishing || w.uploading;
  const editing = !w.applying && !w.needsChanges;

  const hint = w.uploading
    ? w.uploadNote || 'Uploading…'
    : unmet
      ? `Still needed: ${unmet.t.toLowerCase()}`
      : editing
        ? w.dirty ? 'Not saved yet' : ''
        : 'Press Enter ↵ to continue';

  if (editing) {
    return (
      <div className="foot">
        <div className="foot-in">
          <button type="button" className="back" onClick={w.goBack}>
            {w.step === 0 ? 'Close' : '← Back'}
          </button>

          <span className="hint">{hint}</span>

          {!last && (
            <button type="button" className="btn btn-quiet" onClick={w.goNext}>
              Next section
            </button>
          )}

          <button type="button" className="go" onClick={w.saveNow} disabled={busy}>
            {w.publishing ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  let forward = 'Continue';
  if (last) forward = w.applying ? (w.publishing ? 'Sending…' : 'Send application') : 'Review and send back';

  return (
    <div className="foot">
      <div className="foot-in">
        <button type="button" className="back" onClick={w.goBack}>
          {w.step === 0 ? 'Home' : '← Back'}
        </button>

        <span className="hint">{hint}</span>

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
