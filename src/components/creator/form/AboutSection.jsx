import React, { useState } from 'react';
import { LIMITS, MAX_TAGS, PROMPTS, TAG_IDEAS } from '@/lib/creatorProfile';
import { Field } from './Field';

/** The words on a page: one line, tags, a bio, a prompt, the kit, the limits. All optional. */
export default function AboutSection({ form, set }) {
  const [draftTag, setDraftTag] = useState('');
  const ideas = TAG_IDEAS.filter((idea) => !form.tags.includes(idea));
  const full = form.tags.length >= MAX_TAGS;

  const addTag = (raw) => {
    const value = String(raw || '').trim().toLowerCase().replace(/,/g, '').slice(0, 24);
    if (!value || full || form.tags.includes(value)) return;
    set({ tags: [...form.tags, value] });
  };

  return (
    <div className="cf-stack">
      <Field label="One line under your name" note={`${form.oneLiner.length}/${LIMITS.oneLiner}`} htmlFor="cfLine">
        <input
          id="cfLine"
          className="cf-input"
          maxLength={LIMITS.oneLiner}
          value={form.oneLiner}
          placeholder="Flash, sweat, 2am."
          autoComplete="off"
          onChange={(event) => set({ oneLiner: event.target.value })}
        />
      </Field>

      <Field label="Style tags" note={`${form.tags.length}/${MAX_TAGS}`} htmlFor="cfTag">
        {form.tags.length > 0 && (
          <div className="cf-chips" style={{ marginBottom: 10 }}>
            {form.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="cf-chip cf-chip--small is-on"
                onClick={() => set({ tags: form.tags.filter((item) => item !== tag) })}
                aria-label={`Remove ${tag}`}
              >
                {tag} ×
              </button>
            ))}
          </div>
        )}
        {!full && (
          <>
            <input
              id="cfTag"
              className="cf-input"
              value={draftTag}
              maxLength={24}
              placeholder="Type a tag and press Enter"
              autoComplete="off"
              onChange={(event) => setDraftTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault();
                  addTag(draftTag);
                  setDraftTag('');
                }
              }}
            />
            <div className="cf-chips" style={{ marginTop: 10 }}>
              {ideas.slice(0, 6).map((idea) => (
                <button key={idea} type="button" className="cf-chip cf-chip--small" onClick={() => addTag(idea)}>
                  + {idea}
                </button>
              ))}
            </div>
          </>
        )}
      </Field>

      <Field label="How you shoot" note={`${form.bio.length}/${LIMITS.bio}`} htmlFor="cfBio">
        <textarea
          id="cfBio"
          className="cf-input"
          maxLength={LIMITS.bio}
          value={form.bio}
          placeholder="Two or three sentences on your style and what it's like to work with you."
          onChange={(event) => set({ bio: event.target.value })}
        />
      </Field>

      <Field label="Finish a sentence" note="Optional">
        <div className="cf-options" role="radiogroup">
          {PROMPTS.map((prompt, i) => (
            <button
              key={prompt}
              type="button"
              role="radio"
              aria-checked={form.promptIdx === i}
              className={`cf-option ${form.promptIdx === i ? 'is-on' : ''}`}
              onClick={() => set({ promptIdx: form.promptIdx === i ? null : i })}
            >
              {prompt}
            </button>
          ))}
        </div>
        {form.promptIdx != null && (
          <input
            className="cf-input"
            style={{ marginTop: 10 }}
            maxLength={LIMITS.promptA}
            value={form.promptA}
            placeholder="…"
            autoComplete="off"
            aria-label="Your answer"
            onChange={(event) => set({ promptA: event.target.value })}
          />
        )}
      </Field>

      <div className="cf-row cf-row--wide-first">
        <Field label="What's in the bag" htmlFor="cfKit">
          <input
            id="cfKit"
            className="cf-input"
            maxLength={LIMITS.equip}
            value={form.equip}
            placeholder="Sony A7IV, 35mm, one flash"
            autoComplete="off"
            onChange={(event) => set({ equip: event.target.value })}
          />
        </Field>
        <Field label="Years shooting" htmlFor="cfYears">
          <input
            id="cfYears"
            className="cf-input"
            inputMode="numeric"
            maxLength={2}
            value={form.years}
            placeholder="3"
            autoComplete="off"
            onChange={(event) => set({ years: event.target.value.replace(/\D/g, '') })}
          />
        </Field>
      </div>

      <Field
        label="What you don't shoot"
        note={`${form.dont.length}/${LIMITS.dont}`}
        htmlFor="cfDont"
        hint="Saying no saves you and the client a bad match. Keep contact details out of all of these: they stay private until a booking is confirmed."
      >
        <input
          id="cfDont"
          className="cf-input"
          maxLength={LIMITS.dont}
          value={form.dont}
          placeholder="No weddings or newborns."
          autoComplete="off"
          onChange={(event) => set({ dont: event.target.value })}
        />
      </Field>
    </div>
  );
}
