import React from 'react';
import { Eye } from 'lucide-react';
import { LOGO_URL } from '@/components/shared/StelliWordmark';
import WizardChapters from '@/components/wizard/WizardChapters';
import { STEPS } from '@/lib/wizardData';

/** The wizard's own bar: the wordmark, where you are, and the way out. */
export default function WizardTopbar({ w }) {
  const building = w.view === 'wizard' || w.view === 'preview';

  return (
    <div className="topbar">
      <div className="top-in">
        <img src={LOGO_URL} alt="Stelli" className="wordmark-img" />

        <span className="where">
          {w.existing ? 'Edit profile' : 'Creator profile'} · Elon
          {w.view === 'wizard' && (
            <>
              &nbsp;—&nbsp; <b>Step {w.step + 1} of {STEPS.length}</b>
            </>
          )}
        </span>

        <div className="top-right">
          {building && (
            <span className={`save-state ${w.saveState === 'Draft saved' || w.saveState === 'Up to date' ? 'ok' : ''}`} role="status">
              <span className="d" />
              <span className="t">{w.saveState || 'Draft saved'}</span>
            </span>
          )}
          {w.view === 'wizard' && (
            <button type="button" className="top-link top-preview" onClick={() => w.setSheetOpen(true)}>
              <Eye className="w-4 h-4" /> Preview
            </button>
          )}
          <button
            type="button"
            className="top-link"
            onClick={() => {
              if (!w.dirty) return w.exit();
              return w.setConfirm({
                title: 'Leave without publishing?',
                text: 'Your changes are kept on this device, but your page stays as it is until you publish them.',
                yes: 'Leave',
                onYes: w.exit,
              });
            }}
          >
            {w.existing ? 'Exit' : <>Save &amp; exit</>}
          </button>
        </div>
      </div>

      {w.view === 'wizard' && (
        <div className="top-progress">
          <WizardChapters
            step={w.step}
            maxStep={w.maxStep}
            onJump={(index) => w.goStep(index, { jump: true })}
          />
        </div>
      )}
    </div>
  );
}