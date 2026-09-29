import React from 'react';
import { ChevronRight } from 'lucide-react';
import { EXTRAS, PROMPTS, REQS, stepIdx } from '@/lib/wizardData';
import WizardPhone from './WizardPhone';
import WizardProfilePreview from './WizardProfilePreview';

/** The review page: what is missing, how strong the profile is, and publish. */
export default function WizardReview({ w }) {
  const { s } = w;
  const missing = w.missing;
  const extrasMissing = EXTRAS.filter((extra) => !extra.ok(s));

  const rows = [
    { t: 'Photo', k: 'photo', v: s.photo ? 'Added' : 'Not added' },
    { t: 'Name & link', k: 'name', v: s.name ? `${s.name} · /${s.slug}` : 'Not set' },
    { t: 'One-liner & tags', k: 'line', v: s.oneLiner || s.tags.join(' · ') || 'Empty' },
    { t: 'Where you shoot', k: 'where', v: s.where.join(', ') || 'None picked' },
    { t: 'What you shoot', k: 'what', v: s.what.join(', ') || 'None picked' },
    { t: 'Portfolio', k: 'pf', v: s.portfolio.length ? `${s.portfolio.length} shots` : 'Empty' },
    { t: 'Packages', k: 'price', v: w.tiers.map((tier) => `$${Number(tier.price)}`).join(' · ') || 'No prices yet' },
    { t: 'Bio', k: 'bio', v: s.bio || 'Empty' },
    { t: 'Kit', k: 'kit', v: [s.equip, s.years && `${s.years} yrs`].filter(Boolean).join(' · ') || 'Empty' },
    { t: 'Prompt', k: 'prompt', v: s.promptIdx != null ? PROMPTS[s.promptIdx] : 'Not picked' },
    { t: "Don't shoot", k: 'dont', v: s.dont || 'Empty' },
    { t: 'The look', k: 'look', v: `${s.theme === 'clean' ? 'Clean' : 'Night Flash'} · ${s.accent}` },
    { t: 'Private info', k: 'priv', v: s.email || 'No email yet' },
  ];

  return (
    <div className="pv">
      <div>
        <WizardPhone>
          <WizardProfilePreview s={s} />
        </WizardPhone>
      </div>

      <div>
        <div className="pv-head">
          <p className="lbl" style={{ marginBottom: 10 }}>
            Review
          </p>
          <h1>{w.approved ? 'Your live page.' : 'This is your page.'}</h1>
          <p>Exactly what Elon clients see when they're deciding who to book. Tap anything to jump back and edit it.</p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>{missing.length === 0 ? 'Ready to go live ✓' : 'To go live'}</h3>
            <span className="count">
              {REQS.length - missing.length}/{REQS.length}
            </span>
          </div>
          <div className="check-list">
            {REQS.map((req) => {
              const done = req.ok(s);
              return (
                <div key={req.t} className={`check ${done ? 'ok' : 'no'}`}>
                  <span className="ic">{done ? '✓' : ''}</span>
                  <span className="t">{req.t}</span>
                  {!done && (
                    <button type="button" className="link-btn" onClick={() => w.goStep(stepIdx(req.k), { jump: true })}>
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Profile strength</h3>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{w.strength}%</span>
          </div>
          <div className="bar">
            <i style={{ width: `${w.strength}%` }} />
          </div>
          {extrasMissing.length ? (
            <>
              <p className="hint" style={{ marginTop: 12 }}>
                Complete profiles get picked more. Quick adds:
              </p>
              <div className="tips">
                {extrasMissing.map((extra) => (
                  <button key={extra.t} type="button" className="tip" onClick={() => w.goStep(stepIdx(extra.k), { jump: true })}>
                    + {extra.t}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="hint" style={{ marginTop: 12 }}>
              Everything's filled in. Nice.
            </p>
          )}
        </div>

        <div className="panel" style={{ padding: 0, background: 'none', border: 'none' }}>
          <div className="edit-list">
            {rows.map((row) => (
              <button key={row.t} type="button" className="edit-item" onClick={() => w.goStep(stepIdx(row.k), { jump: true })}>
                <span style={{ minWidth: 0 }}>
                  <span className="ei-t">{row.t}</span>
                  <span className="ei-v">{row.v}</span>
                </span>
                <span className="chev">
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="publish-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={w.publish}
            disabled={missing.length > 0 || w.publishing}
          >
            {w.publishing ? 'Publishing…' : w.approved ? 'Update live page' : 'Publish profile'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => w.goStep(Math.min(w.maxStep, 12), { jump: true })}>
            Keep editing
          </button>
          {missing.length > 0 && (
            <span className="hint" style={{ margin: 0 }}>
              {missing.length} item{missing.length > 1 ? 's' : ''} left before you can publish
            </span>
          )}
        </div>
      </div>
    </div>
  );
}