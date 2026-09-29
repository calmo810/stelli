import React, { useState } from 'react';
import { STARTERS, TAG_IDEAS } from '@/lib/wizardData';

export default function StepOneLiner({ w }) {
  const [draftTag, setDraftTag] = useState('');
  const { s } = w;
  const ideas = TAG_IDEAS.filter((idea) => !s.tags.includes(idea));

  const addTag = (raw) => {
    const value = String(raw || '').trim().toLowerCase().replace(/,/g, '');
    if (!value || s.tags.length >= 3 || s.tags.includes(value)) return;
    w.patch({ tags: [...s.tags, value] });
  };

  return (
    <>
      <div className="field">
        <div className="lbl-line">
          <label className="lbl" htmlFor="fLine">
            One-liner
          </label>
          <span className={`count ${s.oneLiner.length > 80 ? 'near' : ''}`}>{s.oneLiner.length}/90</span>
        </div>
        <input
          id="fLine"
          className="inp"
          maxLength={90}
          value={s.oneLiner}
          placeholder="Flash, sweat, 2am."
          autoComplete="off"
          onChange={(event) => w.patch({ oneLiner: event.target.value })}
        />
      </div>

      <div className="field">
        <div className="lbl-line">
          <label className="lbl" htmlFor="fTag">
            Style tags
          </label>
          <span className="count">{s.tags.length}/3</span>
        </div>
        <input
          id="fTag"
          className="inp"
          data-no-enter="true"
          value={draftTag}
          placeholder={s.tags.length >= 3 ? "That's three — remove one to swap" : 'Type a tag and press Enter'}
          autoComplete="off"
          maxLength={24}
          disabled={s.tags.length >= 3}
          onChange={(event) => setDraftTag(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addTag(draftTag);
              setDraftTag('');
            }
            if (event.key === 'Backspace' && !draftTag && s.tags.length) {
              w.patch({ tags: s.tags.slice(0, -1) });
            }
          }}
        />

        {s.tags.length > 0 && (
          <div className="tag-row">
            {s.tags.map((tag, i) => (
              <span key={tag} className="tagchip">
                {tag}
                <button type="button" onClick={() => w.patch({ tags: s.tags.filter((_, idx) => idx !== i) })} aria-label={`Remove ${tag}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {s.tags.length < 3 && ideas.length > 0 && (
          <div className="chips small" style={{ marginTop: 12 }}>
            {ideas.slice(0, 6).map((idea) => (
              <button key={idea} type="button" className="chip" onClick={() => addTag(idea)}>
                + {idea}
              </button>
            ))}
          </div>
        )}

        <div className="shows-as">
          Shows as <b>{s.tags.join(' · ') || 'your · style · tags'}</b>
        </div>
      </div>

      <span className="lbl subhead">Need a nudge? Tap one to start from it</span>
      <div className="steal">
        {STARTERS.map((starter) => (
          <button key={starter.key} type="button" className="steal-btn" onClick={() => w.patch({ oneLiner: starter.oneLiner })}>
            “{starter.oneLiner}”
          </button>
        ))}
      </div>
    </>
  );
}