import React, { useEffect, useRef } from 'react';
import '@/styles/profileWizard.css';
import { STEPS } from '@/lib/wizardData';
import useWizard from '@/hooks/useWizard';
import WizardTopbar from '@/components/wizard/WizardTopbar';
import WizardChapters from '@/components/wizard/WizardChapters';
import WizardCard from '@/components/wizard/WizardCard';
import WizardSide from '@/components/wizard/WizardSide';
import WizardWelcome from '@/components/wizard/WizardWelcome';
import WizardReview from '@/components/wizard/WizardReview';
import WizardShare from '@/components/wizard/WizardShare';
import WizardAlert from '@/components/wizard/WizardAlert';
import WizardSheet from '@/components/wizard/WizardSheet';
import { STEP_BODIES } from '@/components/wizard/steps';

/**
 * Creator profile creation: thirteen steps, a live preview the whole way,
 * and one publish that files the profile with Stelli.
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
      if (event.key !== 'Enter' || event.isComposing || wizard.view !== 'wizard') return;
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT') return;
      if (target?.dataset?.noEnter === 'true') return;
      event.preventDefault();
      wizard.goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!w.ready) {
    return (
      <div className="pw-root">
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
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
              <WizardChapters step={w.step} maxStep={w.maxStep} onJump={(index) => w.goStep(index, { jump: true })} />
              <WizardCard w={w}>
                <StepBody w={w} />
              </WizardCard>
            </main>
            <WizardSide w={w} />
          </div>
        )}

        {w.view === 'preview' && <WizardReview w={w} />}
        {w.view === 'share' && <WizardShare w={w} />}
      </div>

      {w.sheetOpen && <WizardSheet w={w} />}
      <WizardAlert w={w} />
      <div className={`toast ${w.toast ? 'show' : ''}`}>{w.toast}</div>
      <div className={`flash ${w.flash ? 'go' : ''}`} />
    </div>
  );
}