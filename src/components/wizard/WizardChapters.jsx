import React from 'react';

/** The chapters of this flow, each a row of dots that doubles as a way back. */
export default function WizardChapters({ steps, step, maxStep, onJump }) {
  const chapters = [...new Set(steps.map((item) => item.chapter))];
  const current = steps[step].chapter;
  return (
    <nav className="chapters" aria-label="Progress">
      {chapters.map((chapter) => (
        <div key={chapter} className={`chap ${chapter === current ? 'cur' : ''}`}>
          <span className="chap-label">{chapter}</span>
          <div className="chap-dots">
            {steps
              .map((s, i) => ({ s, i }))
              .filter(({ s }) => s.chapter === chapter)
              .map(({ s, i }) => {
                const can = i <= maxStep && i !== step;
                return (
                  <button
                    key={s.key}
                    type="button"
                    className={`dot ${i === step ? 'now' : i <= maxStep ? 'done' : ''}`}
                    onClick={can ? () => onJump(i) : undefined}
                    tabIndex={can ? 0 : -1}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}
