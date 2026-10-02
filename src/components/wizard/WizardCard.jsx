import React from 'react';
import { CHAPTERS, REQS, STEPS } from '@/lib/wizardData';

/** One step: its chapter, its title, its body and any validation message. */
export default function WizardCard({ w, children }) {
  const meta = STEPS[w.step];
  const req = REQS.find((r) => r.k === meta.key);
  const met = req ? req.ok(w.s) : false;

  return (
    <section key={w.step} className={`card ${w.dir > 0 ? 'enter' : 'enter-back'}`} aria-labelledby="stepTitle">
      <div className="step-head">
        <span className="kicker">
          {String(w.step + 1).padStart(2, '0')} · {CHAPTERS[meta.ch]}
        </span>
        {(meta.need || meta.required) && req && (
          <span className={`badge ${met ? 'met' : ''}`}>{met ? 'Done' : 'Needed to publish'}</span>
        )}
      </div>

      <h1 className="step-title" id="stepTitle">
        {meta.title}
      </h1>
      <p className="step-sub">{meta.sub}</p>
      <div className="step-body">{children}</div>

      <div className={`err ${w.errMsg ? 'show' : ''}`} role="alert">
        {w.errMsg ? `⚠︎ ${w.errMsg}` : ''}
      </div>
    </section>
  );
}