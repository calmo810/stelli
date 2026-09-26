import React from 'react';

/** One message in the FAQ thread, or the three dots while Stelli types. */
export default function FaqBubble({ from = 'them', text, typing = false }) {
  const mine = from === 'me';

  return (
    <div
      aria-label={typing ? 'Stelli is typing' : undefined}
      className={`faq-bubble max-w-[78%] rounded-[20px] px-3.5 py-2.5 text-[15px] leading-[1.35] ${
        mine
          ? 'self-end rounded-br-[6px] bg-neon-lime text-ink'
          : 'self-start rounded-bl-[6px] bg-white/10 text-white'
      }`}
    >
      {typing ? (
        <span className="inline-flex items-center gap-1">
          <i className="faq-dot block h-[7px] w-[7px] rounded-full bg-white/55" />
          <i className="faq-dot block h-[7px] w-[7px] rounded-full bg-white/55" />
          <i className="faq-dot block h-[7px] w-[7px] rounded-full bg-white/55" />
        </span>
      ) : (
        text
      )}
    </div>
  );
}