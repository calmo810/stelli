import React from 'react';
import { MIN_SHOTS, hasContent } from '@/lib/wizardData';

/**
 * The front door, shown in two cases only: someone applying (what it takes,
 * how long), and a creator a founder has asked for a change (the note). A page
 * being edited from the portal never lands here — it opens on the section
 * that was tapped.
 */
export default function WizardWelcome({ w }) {
  if (!w.applying) {
    return (
      <div className="welcome">
        <p className="lbl" style={{ marginBottom: 16 }}>
          Creator profile · Elon pilot
        </p>
        <h1>
          {w.needsChanges ? 'One thing' : 'Your page.'}
          {w.needsChanges && (
            <>
              <br />
              <em>before you go live.</em>
            </>
          )}
        </h1>

        {w.needsChanges && (
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
        )}

        <div className="welcome-actions">
          <button type="button" className="btn btn-primary" onClick={() => w.setView('preview')}>
            {w.needsChanges ? 'Update my page' : 'Open my page'}
          </button>
        </div>
      </div>
    );
  }

  const resume = hasContent(w.s);

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
