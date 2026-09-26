import React from 'react';

/** The questions you can tap. They lock while an answer is on its way. */
export default function FaqChips({ items, busy, onAsk }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 border-t border-white/[0.07] pt-3.5">
      {items.map((item) => (
        <button
          key={item.q}
          type="button"
          disabled={busy}
          onClick={() => onAsk(item)}
          className="min-h-[38px] rounded-[980px] border border-neon-lime/45 px-3.5 py-2.5 text-[13px] font-medium text-neon-lime transition-[background-color,transform] duration-200 hover:bg-neon-lime/10 active:scale-[0.96] disabled:cursor-default disabled:opacity-35"
        >
          {item.q}
        </button>
      ))}
    </div>
  );
}