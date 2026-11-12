import React from 'react';
import { REQS } from '@/lib/wizardData';

/** One step: its chapter, its title, its body and any validation message. */
export default function WizardCard({ w, children }) {
  const meta = w.steps[w.step];
  const reqs = REQS.filter((r) => r.k === meta.key);
  const met = reqs.length > 0 && reqs.every((r) => r.ok(w.s));

  return (
    <section key={w.step} className={`card ${w.dir > 0 ? 'enter' : 'enter-back'}`} aria-labelledby="stepTitle">
      <div className="step-head">
        <span className="kicker">
          {String(w.step + 1).padStart(2, '0')} · {meta.chapter}
        </span>
        {reqs.length > 0 && <span className={`badge ${met ? 'met' : ''}`}>{met ? 'Done' : 'Needed'}</span>}
        {reqs.length === 0 && meta.optional && <span className="badge">Optional</span>}
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
