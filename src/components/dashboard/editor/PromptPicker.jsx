import React from 'react';
import { LIMITS, PROMPTS } from '@/lib/profilePresets';
import LimitedTextField from './LimitedTextField';

export default function PromptPicker({ question, answer, onChange, error }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="label-mono text-[9px] text-white/40 mb-2">Pick a prompt</p>
        <select
          value={question || ''}
          onChange={(e) => onChange({ prompt_question: e.target.value })}
          className="w-full border bg-white/[0.03] px-4 py-3 font-body text-[13px] text-white outline-none focus:border-neon-lime"
          style={{ borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}
        >
          <option value="" style={{ color: '#0a1226' }}>Choose one…</option>
          {PROMPTS.map((prompt) => (
            <option key={prompt} value={prompt} style={{ color: '#0a1226' }}>{prompt}</option>
          ))}
        </select>
      </div>

      {question && (
        <LimitedTextField
          label="Your answer"
          value={answer}
          limit={LIMITS.prompt_answer}
          multiline
          rows={3}
          placeholder="Say the thing only you would say."
          onChange={(value) => onChange({ prompt_answer: value })}
          error={error}
        />
      )}
    </div>
  );
}