import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { REQS, STEPS } from '@/lib/wizardData';

/** One step: its title, its body, and the way forward. */
export default function WizardCard({ w, children }) {
  const meta = STEPS[w.step];
  const req = REQS.find((r) => r.k === meta.key);
  const met = req ? req.ok(w.s) : false;
  const last = w.step === STEPS.length - 1;
  const skipLabel = meta.need ? 'Add later' : meta.optional ? 'Skip' : '';

  return (
    <section key={w.step} className={`card ${w.dir > 0 ? 'enter' : 'enter-back'}`} aria-labelledby="stepTitle">
      <div className="card-nav">
        <button type="button" className="back" onClick={w.goBack}>
          <ArrowLeft className="w-3.5 h-3.5" /> {w.step === 0 ? 'Home' : 'Back'}
        </button>
        <span className="step-count">
          {w.step + 1} of {STEPS.length}
        </span>
      </div>

      {(meta.need || meta.required) && req && (
        <span className={`badge ${met ? 'met' : ''}`}>{met ? '✓ Done' : 'Needed to publish'}</span>
      )}

      <h1 className="step-title" id="stepTitle">
        {meta.title}
      </h1>
      <p className="step-sub">{meta.sub}</p>
      <div className="step-body">{children}</div>

      <div className={`err ${w.errMsg ? 'show' : ''}`} role="alert">
        {w.errMsg ? `⚠︎ ${w.errMsg}` : ''}
      </div>

      <div className="card-foot">
        <span className="kbd-hint">
          Press <kbd>Enter ↵</kbd> to continue
        </span>
        {skipLabel && (
          <button type="button" className="btn btn-quiet" onClick={() => (last ? w.setView('preview') : w.goStep(w.step + 1))}>
            {skipLabel}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={w.goNext} disabled={w.publishing}>
          {last ? 'Review my page' : 'Continue'}
        </button>
      </div>
    </section>
  );
}