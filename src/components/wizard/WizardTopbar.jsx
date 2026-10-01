import React from 'react';
import { Eye } from 'lucide-react';
import { LOGO_URL } from '@/components/shared/StelliWordmark';

/** The wizard's own bar: the wordmark, the draft state, and the way out. */
export default function WizardTopbar({ w }) {
  const building = w.view === 'wizard' || w.view === 'preview';
  return (
    <div className="topbar">
      <img src={LOGO_URL} alt="Stelli" className="wordmark-img" />
      <div className="top-right">
        {building && (
          <span className={`save-state ${w.saveState === 'Draft saved' ? 'ok' : ''}`}>
            <span className="d" />
            <span className="t">{w.saveState || 'Draft saved'}</span>
          </span>
        )}
        {w.view === 'wizard' && (
          <button type="button" className="top-link top-preview" onClick={() => w.setSheetOpen(true)}>
            <Eye className="w-4 h-4" /> Preview
          </button>
        )}
        <button type="button" className="top-link" onClick={w.exit}>
          Save &amp; exit
        </button>
      </div>
    </div>
  );
}