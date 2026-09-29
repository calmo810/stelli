import React from 'react';
import { CHAPTERS, STEPS } from '@/lib/wizardData';

/** The six chapters, each a row of dots that doubles as a way back. */
export default function WizardChapters({ step, maxStep, onJump }) {
  const current = STEPS[step].ch;
  return (
    <nav className="chapters" aria-label="Progress">
      {CHAPTERS.map((chapter, ci) => (
        <div key={chapter} className={`chap ${ci === current ? 'cur' : ''}`}>
          <span className="chap-label">{chapter}</span>
          <div className="chap-dots">
            {STEPS.map((s, i) => ({ s, i }))
              .filter(({ s }) => s.ch === ci)
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