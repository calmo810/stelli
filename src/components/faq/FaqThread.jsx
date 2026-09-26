import React, { useEffect, useRef, useState } from 'react';
import { FAQ_THREAD } from '@/lib/faqThread';
import FaqBubble from './FaqBubble';
import FaqChips from './FaqChips';

const GREETING = { id: 'greeting', from: 'them', text: 'Hey! What do you want to know?' };

/** Stelli answering, one tapped question at a time. */
export default function FaqThread() {
  const [messages, setMessages] = useState([GREETING]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const threadRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages, typing]);

  const ask = (item) => {
    if (busy) return;
    setBusy(true);
    setMessages((all) => [...all, { id: `q-${item.q}`, from: 'me', text: item.q }]);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timers.current.push(setTimeout(() => setTyping(true), reduced ? 0 : 250));
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        setMessages((all) => [...all, { id: `a-${item.q}`, from: 'them', text: item.a }]);
        setBusy(false);
      }, reduced ? 0 : 1100)
    );
  };

  return (
    <div className="mx-auto mt-11 w-full max-w-[460px] rounded-[32px] border border-white/[0.08] bg-surface px-4 pb-4 pt-[18px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
      <div className="flex flex-col items-center gap-1.5 border-b border-white/[0.07] pb-3.5">
        <div
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-full bg-neon-lime font-display text-[20px] font-semibold text-ink"
        >
          S
        </div>
        <span className="text-[12px] text-white/60">Stelli</span>
      </div>

      <div
        ref={threadRef}
        aria-live="polite"
        className="no-scrollbar flex h-[300px] flex-col gap-2 overflow-y-auto scroll-smooth px-1 pb-1.5 pt-4"
      >
        {messages.map((message) => (
          <FaqBubble key={message.id} from={message.from} text={message.text} />
        ))}
        {typing && <FaqBubble typing />}
      </div>

      <FaqChips items={FAQ_THREAD} busy={busy} onAsk={ask} />
    </div>
  );
}