import React from 'react';
import { MIN_SHOTS, STARTERS, hasContent } from '@/lib/wizardData';

/**
 * The front door. Applying: what it takes and how long. Editing: the way back
 * into the page, a founder's note if there is one, and the starter styles.
 */
export default function WizardWelcome({ w }) {
  const resume = hasContent(w.s);

  if (w.applying) {
    return (
      <div className="welcome">
        <p className="lbl" style={{ marginBottom: 16 }}>
          Creator application · Elon pilot
        </p>
        <h1>
          Apply in about
          <br />
          <em>three minutes.</em>
        </h1>
        <p className="sub">
          Four short screens. We look at every application ourselves. The rest of your page can wait until after you
          apply.
        </p>

        <div className="need">
          <span>
            You'll need: <b>a photo of you</b>
          </span>
          <span>
            <b>{MIN_SHOTS} of your best shots</b>
          </span>
        </div>

        <div className="welcome-actions">
          {resume ? (
            <>
              <button type="button" className="btn btn-primary" onClick={() => w.goStep(w.maxStep)}>
                Continue where you left off
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() =>
                  w.setConfirm({
                    title: 'Start over?',
                    text: "This clears everything you've entered so far.",
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
              Start
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="welcome">
      <p className="lbl" style={{ marginBottom: 16 }}>
        Creator profile · Elon pilot
      </p>
      <h1>
        {w.needsChanges ? 'One thing' : 'Your page,'}
        <br />
        <em>{w.needsChanges ? 'before you go live.' : 'your way.'}</em>
      </h1>

      {w.needsChanges ? (
        <>
          <p className="sub">We looked at your application and it's close. Here's what we'd like you to change:</p>
          <div className="panel" style={{ textAlign: 'left', marginTop: 18 }}>
            <p className="lbl" style={{ marginBottom: 8 }}>
              From the Stelli team
            </p>
            <p style={{ whiteSpace: 'pre-line', lineHeight: 1.55 }}>
              {w.changesNote || 'Check your email for our note.'}
            </p>
          </div>
        </>
      ) : (
        <p className="sub">
          {w.approved
            ? 'Change anything, any time. Updates go live when you save.'
            : 'Your application is in. Add the rest whenever you like: it all goes live the moment you are approved.'}
        </p>
      )}

      <div className="welcome-actions">
        <button type="button" className="btn btn-primary" onClick={() => w.goStep(0)}>
          {w.needsChanges ? 'Update my page' : 'Edit my page'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => w.setView('preview')}>
          {w.needsChanges ? 'Review and send back' : 'Preview my page'}
        </button>
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
