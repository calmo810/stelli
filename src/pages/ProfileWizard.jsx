import React, { useEffect, useRef } from 'react';
import '@/styles/profileWizard.css';
import { STEPS } from '@/lib/wizardData';
import useWizard from '@/hooks/useWizard';
import WizardTopbar from '@/components/wizard/WizardTopbar';
import WizardCard from '@/components/wizard/WizardCard';
import WizardFooter from '@/components/wizard/WizardFooter';
import WizardSide from '@/components/wizard/WizardSide';
import WizardWelcome from '@/components/wizard/WizardWelcome';
import WizardReview from '@/components/wizard/WizardReview';
import WizardShare from '@/components/wizard/WizardShare';
import WizardAlert from '@/components/wizard/WizardAlert';
import WizardSheet from '@/components/wizard/WizardSheet';
import { STEP_BODIES } from '@/components/wizard/steps';

/**
 * The creator profile wizard: thirteen steps, a live preview the whole way,
 * and one publish that files the profile with Stelli. /apply and /edit-profile
 * both land here; a creator who already has a page opens on its review.
 */
export default function ProfileWizard() {
  const w = useWizard();
  const latest = useRef(w);
  latest.current = w;

  // Enter advances the step; Escape closes whatever is open.
  useEffect(() => {
    const onKey = (event) => {
      const wizard = latest.current;
      if (event.key === 'Escape') {
        if (wizard.confirm) {
          wizard.setConfirm(null);
          return;
        }
        if (wizard.sheetOpen) wizard.setSheetOpen(false);
        return;
      }
      if (event.key !== 'Enter' || event.isComposing || wizard.view !== 'wizard' || wizard.confirm) return;
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT' || tag === 'A') return;
      if (target?.dataset?.noEnter === 'true') return;
      event.preventDefault();
      wizard.goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (w.loadFailed) {
    return (
      <div className="pw-root">
        <div className="pw-state" role="alert">
          <h1>Your profile didn't load.</h1>
          <p>Nothing has been changed. Check your connection and try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => w.retryLoad()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!w.ready) {
    return (
      <div className="pw-root">
        <div className="pw-state" role="status" aria-label="Loading your profile">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-white" />
        </div>
      </div>
    );
  }

  const StepBody = STEP_BODIES[STEPS[w.step].key];

  return (
    <div className="pw-root">
      <WizardTopbar w={w} />

      <div className="stage">
        {w.view === 'welcome' && <WizardWelcome w={w} />}

        {w.view === 'wizard' && (
          <div className="wiz">
            <main>
              <WizardCard w={w}>
                <StepBody w={w} />
              </WizardCard>
            </main>
            <WizardSide w={w} />
            <WizardFooter w={w} />
          </div>
        )}

        {w.view === 'preview' && <WizardReview w={w} />}
        {w.view === 'share' && <WizardShare w={w} />}
      </div>

      {w.sheetOpen && <WizardSheet w={w} />}
      <WizardAlert w={w} />
      <div className={`toast ${w.toast ? 'show' : ''}`} role="status" aria-live="polite">{w.toast}</div>
      <div className={`flash ${w.flash ? 'go' : ''}`} aria-hidden />
    </div>
  );
}
