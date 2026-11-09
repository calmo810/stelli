import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FAQ_THREAD, FAQ_EMAIL, replyTo } from '@/lib/faqThread';
import { askStelli, resetConversation } from '@/lib/askStelli';
import { LOGO_URL } from '@/components/shared/StelliWordmark';
import './faqPhone.css';

/*
 * The FAQ as a real iMessage conversation on an iPhone 17 Pro.
 *
 * The screen is laid out at the phone's true size in iOS points (402 × 874) and
 * the whole device is scaled to fit, so every measurement (17pt text, 44pt glass
 * buttons, bubble radii, Dynamic Island) matches the real thing.
 *
 * Tap a suggested question (Apple Messages for Business-style quick replies) or
 * type your own: it sends, shows Delivered → Read, Stelli types, and answers.
 */

const DEVICE_W = 426; // 402pt screen + bezel + frame
const DEVICE_H = 898; // 874pt screen + bezel + frame
const GREETING = 'Hey! What do you want to know?';

const clock = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/, '');
const clockFull = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let uid = 0;
const nextId = () => `m${++uid}`;

/* ---------- SF Symbol-style glyphs ---------- */
const Chevron = () => (
  <svg width="13" height="22" viewBox="0 0 13 22" fill="none" aria-hidden="true">
    <path d="M11 2 2 11l9 9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const VideoGlyph = () => (
  <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden="true">
    <rect x="1.2" y="2.2" width="16.6" height="13.6" rx="3.6" stroke="currentColor" strokeWidth="2.1" />
    <path d="M18.6 7.2 23.4 4c.6-.4 1.4 0 1.4.8v8.4c0 .8-.8 1.2-1.4.8l-4.8-3.2" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
  </svg>
);
const PlusGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
const MicGlyph = () => (
  <svg width="14" height="21" viewBox="0 0 14 21" fill="none" aria-hidden="true">
    <rect x="3.6" y="1" width="6.8" height="12" rx="3.4" fill="currentColor" />
    <path d="M1 9.6a6 6 0 0 0 12 0M7 15.7V19.5M4.2 19.5h5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const SendGlyph = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
    <path d="M7 14.5V2M1.8 7 7 1.6 12.2 7" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function StatusIcons() {
  return (
    <span className="ip-status-icons" aria-hidden="true">
      <svg width="19" height="12" viewBox="0 0 19 12" fill="#fff">
        <rect x="0" y="8" width="3.2" height="4" rx="1" />
        <rect x="5.2" y="5.5" width="3.2" height="6.5" rx="1" />
        <rect x="10.4" y="3" width="3.2" height="9" rx="1" />
        <rect x="15.6" y="0" width="3.2" height="12" rx="1" />
      </svg>
      <svg width="17" height="12" viewBox="0 0 17 12" fill="#fff">
        <path d="M8.5 2.3c2.5 0 4.7 1 6.4 2.5l1.2-1.3A10.9 10.9 0 0 0 8.5.5C5.6.5 2.9 1.6.9 3.5l1.2 1.3a9.2 9.2 0 0 1 6.4-2.5Z" />
        <path d="M8.5 6c1.5 0 2.8.5 3.8 1.4l1.2-1.3A7.4 7.4 0 0 0 8.5 4.1c-1.9 0-3.7.7-5 1.9l1.2 1.3A5.6 5.6 0 0 1 8.5 6Z" />
        <path d="m8.5 11.2 2.4-2.5a3.5 3.5 0 0 0-4.8 0l2.4 2.5Z" />
      </svg>
      <svg width="28" height="13" viewBox="0 0 28 13" fill="none">
        <rect x=".5" y=".5" width="24" height="12" rx="3.8" stroke="#fff" strokeOpacity=".38" />
        <rect x="2" y="2" width="18.5" height="9" rx="2.4" fill="#fff" />
        <path d="M26 4.4v4.2c.8-.3 1.4-1.2 1.4-2.1 0-1-.6-1.8-1.4-2.1Z" fill="#fff" fillOpacity=".4" />
      </svg>
    </span>
  );
}

/* the iMessage tail: one path, mirrored for the other side */
const Tail = () => (
  <svg className="ip-tail" viewBox="0 0 17 22" aria-hidden="true">
    <path d="M0 0H6V7C6 13 8.6 17.4 15.8 20.6C16.4 20.9 16.2 21.8 15.5 21.8C10.6 22 6.2 20.6 3 17.6C2 16.7.9 16 0 15.6Z" />
  </svg>
);

/* turn the support email into a tappable link, the way iOS data-detects it */
function Linkified({ text }) {
  const parts = text.split(FAQ_EMAIL);
  if (parts.length === 1) return text;
  return parts.map((p, i) => (
    <React.Fragment key={i}>
      {p}
      {i < parts.length - 1 && <a href={`mailto:${FAQ_EMAIL}`}>{FAQ_EMAIL}</a>}
    </React.Fragment>
  ));
}

export default function FaqThread() {
  const [messages, setMessages] = useState([]);
  const [asked, setAsked] = useState(() => new Set());
  const [typing, setTyping] = useState(false);
  const [pending, setPending] = useState(0); // replies still on their way
  const [receipts, setReceipts] = useState({}); // id -> { read, at }
  const [draft, setDraft] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [opened, setOpened] = useState(null);
  const [scale, setScale] = useState(0.86);

  const stageRef = useRef(null);
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const timers = useRef([]);
  const queueEnd = useRef(0);
  const started = useRef(false);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, Math.max(0, ms)));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // live status-bar clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  // scale the 402pt-wide phone to whatever room the page gives it
  useLayoutEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = window.innerHeight - 150;
      setScale(Math.max(0.6, Math.min(0.94, w / DEVICE_W, h / DEVICE_H)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  /** Stelli types for a beat, then the reply lands. Replies queue in order. */
  const stelliSays = useCallback((text, { after = 900 } = {}) => {
    const t0 = Date.now();
    const quick = reducedMotion();
    const start = Math.max(t0 + (quick ? 0 : after), queueEnd.current);
    const typeFor = quick ? 0 : Math.max(900, Math.min(2100, text.length * 17));
    queueEnd.current = start + typeFor + 250;
    setPending((n) => n + 1);
    later(() => setTyping(true), start - t0);
    later(() => {
      setMessages((all) => [...all, { id: nextId(), from: 'them', text }]);
      setPending((n) => n - 1);
    }, start - t0 + typeFor);
  }, []);

  // Stelli says hi when the phone first scrolls into view
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const go = () => {
      if (started.current) return;
      started.current = true;
      setOpened(new Date());
      stelliSays(GREETING, { after: 700 });
    };
    if (!('IntersectionObserver' in window)) {
      go();
      return undefined;
    }
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && go(), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [stelliSays]);

  const send = useCallback(
    async (text, answer) => {
      const clean = text.trim();
      if (!clean) return;
      const id = nextId();
      navigator.vibrate?.(8);
      setMessages((all) => [...all, { id, from: 'me', text: clean, fresh: true }]);
      setReceipts((r) => ({ ...r, [id]: { read: false } }));
      later(() => setReceipts((r) => ({ ...r, [id]: { read: true, at: new Date() } })), reducedMotion() ? 0 : 750);

      // A tapped suggestion already has its written answer. Anything typed goes
      // to the Stelli agent, which reads the app before it answers.
      if (answer) {
        setAsked((s) => new Set(s).add(clean));
        stelliSays(answer, { after: 1100 });
        return;
      }

      setPending((n) => n + 1);
      setTyping(true);
      let reply = '';
      try {
        reply = await askStelli(clean);
      } catch {
        reply = '';
      }
      setPending((n) => n - 1);
      stelliSays(reply || replyTo(clean).text, { after: 400 });
    },
    [stelliSays]
  );

  const onSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    send(draft);
    setDraft('');
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    queueEnd.current = 0;
    resetConversation();
    setAsked(new Set());
    setReceipts({});
    setTyping(false);
    setPending(0);
    setDraft('');
    setMessages([]);
    setOpened(new Date());
    stelliSays(GREETING, { after: 300 });
  };

  // the typing bubble stays up while replies are queued, and goes when the last lands
  useEffect(() => {
    if (pending === 0) setTyping(false);
  }, [pending]);

  // keep the newest message in view, like the real app
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' }));
  }, [messages, typing, pending]);

  const remaining = FAQ_THREAD.filter((f) => !asked.has(f.q));
  const showReplies = messages.length > 0 && pending === 0;
  const lastMe = [...messages].reverse().find((m) => m.from === 'me');
  const items = [...messages, ...(typing ? [{ id: 'typing', from: 'them', typing: true }] : [])];

  return (
    <div ref={stageRef} className="ip-stage">
      <div className="ip-glow" aria-hidden="true" />
      <div className="ip-fit" style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}>
        <div className="ip-device" style={{ transform: `scale(${scale})` }}>
          <span className="ip-btn l action" aria-hidden="true" />
          <span className="ip-btn l vup" aria-hidden="true" />
          <span className="ip-btn l vdown" aria-hidden="true" />
          <span className="ip-btn r power" aria-hidden="true" />
          <span className="ip-btn r camera" aria-hidden="true" />

          <div className="ip-screen">
            {/* ---- conversation ---- */}
            <div
              ref={threadRef}
              className="ip-thread"
              data-lenis-prevent
              role="log"
              aria-live="polite"
              aria-label="Conversation with Stelli"
            >
              <div className="ip-thread-inner">
                {opened && (
                  <p className="ip-stamp">
                    <b>Today</b> {clockFull(opened)}
                  </p>
                )}
                {items.map((m, i) => {
                  const next = items[i + 1];
                  const prev = items[i - 1];
                  const tail = !next || next.from !== m.from;
                  const gap = prev && prev.from !== m.from;
                  const r = receipts[m.id];
                  return (
                    <React.Fragment key={m.id}>
                      <div
                        className={`ip-row ${m.from === 'me' ? 'me' : 'them'}${gap ? ' gap' : ''}${m.fresh ? ' fresh' : ''}`}
                      >
                        {m.typing ? (
                          <div className="ip-bubble ip-typing" aria-label="Stelli is typing">
                            <i />
                            <i />
                            <i />
                          </div>
                        ) : (
                          <div className={`ip-bubble${tail ? ' tail' : ''}`}>
                            <Linkified text={m.text} />
                            {tail && <Tail />}
                          </div>
                        )}
                      </div>
                      {lastMe && m.id === lastMe.id && r && (
                        <p className="ip-receipt" key={`${m.id}-${r.read}`}>
                          {r.read ? (
                            <>
                              <b>Read</b> {clockFull(r.at)}
                            </>
                          ) : (
                            'Delivered'
                          )}
                        </p>
                      )}
                    </React.Fragment>
                  );
                })}

                {showReplies && (
                  <div className="ip-replies" role="group" aria-label="Suggested questions">
                    {remaining.map((f, i) => (
                      <button
                        key={f.q}
                        type="button"
                        className="ip-reply"
                        style={{ animationDelay: `${i * 45}ms` }}
                        onClick={() => send(f.q, f.a)}
                      >
                        {f.q}
                      </button>
                    ))}
                    {remaining.length === 0 && (
                      <>
                        <a className="ip-reply" href={`mailto:${FAQ_EMAIL}`}>
                          Email the team
                        </a>
                        <button type="button" className="ip-reply" onClick={reset}>
                          Start over
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ---- chrome that floats over the conversation ---- */}
            <div className="ip-edge top" aria-hidden="true" />
            <div className="ip-edge bottom" aria-hidden="true" />

            <div className="ip-island" aria-hidden="true" />
            <div className="ip-status" aria-hidden="true">
              <span className="ip-time">{clock(now)}</span>
              <StatusIcons />
            </div>

            <div className="ip-nav">
              <span className="ip-glass ip-circle ip-back" aria-hidden="true">
                <Chevron />
              </span>
              <div className="ip-contact">
                <span className="ip-avatar">
                  <img src={LOGO_URL} alt="" />
                </span>
                <span className="ip-glass ip-name">
                  Stelli
                  <svg width="6" height="10" viewBox="0 0 6 10" aria-hidden="true">
                    <path d="m1 1 4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <span className="ip-glass ip-circle ip-video" aria-hidden="true">
                <VideoGlyph />
              </span>
            </div>

            <form className="ip-compose" onSubmit={onSubmit}>
              <button
                type="button"
                className="ip-glass ip-plus"
                aria-label="Show suggested questions"
                onClick={() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })}
              >
                <PlusGlyph />
              </button>
              <label className="ip-glass ip-field">
                <span className="sr-only">Ask Stelli a question</span>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="iMessage"
                  enterKeyHint="send"
                  autoComplete="off"
                  maxLength={240}
                />
                {draft.trim() ? (
                  <button type="submit" className="ip-send" aria-label="Send">
                    <SendGlyph />
                  </button>
                ) : (
                  <span className="ip-mic" aria-hidden="true">
                    <MicGlyph />
                  </span>
                )}
              </label>
            </form>

            <span className="ip-home" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}