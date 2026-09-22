import React from 'react';

export default function PromptBlock({ question, answer, accent }) {
  if (!question || !answer) return null;

  return (
    <section className="border-y border-white/10 py-12 md:py-16">
      <p className="label-mono text-[10px] mb-5" style={{ color: accent }}>
        {question}
      </p>
      <p
        className="font-heading text-white leading-[1.15]"
        style={{ fontSize: 'clamp(24px, 3.4vw, 42px)' }}
      >
        {answer}
      </p>
    </section>
  );
}