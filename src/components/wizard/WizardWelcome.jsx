import React from 'react';
import { MIN_SHOTS, STARTERS, hasContent } from '@/lib/wizardData';

/** The front door: what is needed, and three starter styles. */
export default function WizardWelcome({ w }) {
  const resume = hasContent(w.s);

  return (
    <div className="welcome">
      <p className="lbl" style={{ marginBottom: 16 }}>
        Creator profile · Elon pilot
      </p>
      <h1>
        Let's build your page,
        <br />
        <em>one step at a time.</em>
      </h1>
      <p className="sub">
        Thirteen quick steps, a live preview the whole way, and a back button everywhere. About five minutes.
      </p>

      <div className="need">
        <span>
          You'll need: <b>a photo of you</b>
        </span>
        <span>
          <b>{MIN_SHOTS}+ of your best shots</b>
        </span>
        <span>
          <b>rough pricing</b>
        </span>
      </div>

      <div className="welcome-actions">
        {resume ? (
          <>
            <button type="button" className="btn btn-primary" onClick={() => w.goStep(w.maxStep)}>
              Continue where you left off
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => w.setView('preview')}>
              Preview my page
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() =>
                w.setConfirm({
                  title: 'Start over?',
                  text: "This clears everything you've entered on this device.",
                  yes: 'Start over',
                  onYes: w.reset,
                })
              }
            >
              Start over
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => w.goStep(0)}>
            Start building
          </button>
        )}
      </div>

      <div className="starters">
        <div className="starters-head">
          <h2>Need a starting point?</h2>
          <p>Pick a starter style. It fills in tags, a sample bio and a look, then you make every word yours.</p>
        </div>
        <div className="starter-row">
          {STARTERS.map((starter) => (
            <button
              key={starter.key}
              type="button"
              className="starter"
              style={{ '--sc': starter.color }}
              onClick={() => w.applyStarter(starter)}
            >
              <div className="starter-art">
                <div className="glow" style={{ background: starter.art }} />
                <span className="chip-demo">
                  {starter.theme === 'clean' ? 'Clean' : 'Night'} · {starter.accent}
                </span>
              </div>
              <div className="starter-body">
                <div className="starter-name">{starter.name}</div>
                <div className="starter-tags">{starter.tags.join(' · ')}</div>
                <div className="starter-line">“{starter.oneLiner}”</div>
                <div className="starter-use">Start with this style →</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}