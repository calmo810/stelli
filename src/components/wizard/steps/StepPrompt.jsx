import React from 'react';
import { LIMITS, promptOptions } from '@/lib/creatorProfile';

export default function StepPrompt({ w }) {
  const { prompt, promptA } = w.s;
  const disabled = !prompt;
  // A profile made in the earlier editor keeps the prompt it already answered.
  const options = promptOptions(w.lensman?.prompt_question);

  return (
    <>
      <div className="prompt-list" role="radiogroup" aria-label="Prompts">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`prompt-opt ${prompt === option ? 'on' : ''}`}
            role="radio"
            aria-checked={prompt === option}
            onClick={() => w.patch({ prompt: prompt === option ? '' : option })}
          >
            {option}
            <span className="radio" />
          </button>
        ))}
      </div>

      <div className="field" style={{ marginTop: 22, opacity: disabled ? 0.4 : 1 }}>
        <div className="lbl-line">
          <label className="lbl" htmlFor="fPromptA">
            Finish the sentence
          </label>
          <span className="count">{promptA.length}/{LIMITS.prompt_answer}</span>
        </div>
        <input
          id="fPromptA"
          className="inp"
          maxLength={LIMITS.prompt_answer}
          value={promptA}
          placeholder={disabled ? 'Pick a prompt first' : '…'}
          autoComplete="off"
          disabled={disabled}
          onChange={(event) => w.patch({ promptA: event.target.value })}
        />
      </div>
    </>
  );
}
