import React from 'react';
import { PROMPTS } from '@/lib/wizardData';

export default function StepPrompt({ w }) {
  const disabled = w.s.promptIdx == null;

  return (
    <>
      <div className="prompt-list" role="radiogroup">
        {PROMPTS.map((prompt, i) => (
          <button
            key={prompt}
            type="button"
            className={`prompt-opt ${w.s.promptIdx === i ? 'on' : ''}`}
            role="radio"
            aria-checked={w.s.promptIdx === i}
            onClick={() => w.patch({ promptIdx: i })}
          >
            {prompt}
            <span className="radio" />
          </button>
        ))}
      </div>

      <div className="field" style={{ marginTop: 22, opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        <label className="lbl" htmlFor="fPromptA">
          Finish the sentence
        </label>
        <input
          id="fPromptA"
          className="inp"
          maxLength={120}
          value={w.s.promptA}
          placeholder="…"
          autoComplete="off"
          disabled={disabled}
          onChange={(event) => w.patch({ promptA: event.target.value })}
        />
      </div>
    </>
  );
}