import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, ChevronLeft, ChevronRight, Mic, Plus, Video } from 'lucide-react';
import { FAQ_THREAD } from '@/lib/faqThread';
import { LOGO_URL } from '@/components/shared/StelliWordmark';
import './faqPhone.css';

const GREETING = { id: 'greeting', from: 'them', text: 'Hey! What do you want to know?' };
const EMAIL = 'getstelli@gmail.com';

const clock = (d = new Date()) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/, '');
const clockFull = (d = new Date()) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function StatusIcons() {
  return (
    <span className="icons" aria-hidden="true">
      <svg width="18" height="11" viewBox="0 0 18 11" fill="#fff">
        <rect x="0" y="7" width="3" height="4" rx="1" />
        <rect x="5" y="5" width="3" height="6" rx="1" />
        <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
        <rect x="15" y="0" width="3" height="11" rx="1" />
      </svg>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="#fff">
        <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.3 10.3 0 008 .4C5.2.4 2.7 1.5.8 3.3L2 4.6a8.5 8.5 0 016-2.4z" />
        <path d="M8 5.6c1.4 0 2.6.5 3.6 1.4l1.2-1.3A7 7 0 008 3.8 7 7 0 003.2 5.7L4.4 7A5.2 5.2 0 018 5.6z" />
        <path d="M8 9.2l2.2-2.3a3.3 3.3 0 00-4.4 0L8 9.2z" transform="translate(0 1.2)" />
      </svg>
      <svg width="27" height="12" viewBox="0 0 27 12" fill="none">
        <rect x=".5" y=".5" width="23" height="11" rx="3.3" stroke="#fff" strokeOpacity=".4" />
        <rect x="2" y="2" width="17" height="8" rx="2" fill="#fff" />
        <path d="M25 4v4c.8-.3 1.3-1.1 1.3-2S25.8 4.3 25 4z" fill="#fff" fillOpacity=".45" />
      </svg>
    </span>
  );
}

/**
 * The FAQ as a conversation on a real-looking phone. Tap a question: it types
 * into the message bar, sends, gets read, and Stelli answers. Every question
 * you've asked grays out in place, so nothing jumps around.
 */
export default function FaqThread() {
  const [messages, setMessages] = useState([GREETING]);
  const [asked, setAsked] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [receipt, setReceipt] = useState(null); // { id, read, at }
  const [now, setNow] = useState(() => new Date());
  const [opened] = useState(() => new Date());
  const threadRef = useRef(null);
  const tiltRef = useRef(null);
  const timers = useRef([]);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [messages, typing, receipt]);

  const ask = useCallback(
    (item) => {
      if (busy || asked.has(item.q)) return;
      setBusy(true);
      setAsked((s) => new Set(s).add(item.q));
      navigator.vibrate?.(6);
      const id = `q-${item.q}`;
      const answer = () => {
        setTyping(false);
        setMessages((all) => [...all, { id: `a-${item.q}`, from: 'them', text: item.a }]);
        setBusy(false);
      };

      if (reducedMotion()) {
        setMessages((all) => [...all, { id, from: 'me', text: item.q }]);
        setReceipt({ id, read: true, at: new Date() });
        answer();
        return;
      }

      // 1. it types itself into the message bar
      const chars = [...item.q];
      const per = Math.max(12, Math.min(26, 520 / chars.length));
      chars.forEach((_, i) => later(() => setDraft(chars.slice(0, i + 1).join('')), per * (i + 1)));
      const sentAt = per * chars.length + 260;

      // 2. sends, then gets read, then Stelli starts typing
      later(() => {
        setDraft('');
        setMessages((all) => [...all, { id, from: 'me', text: item.q, sending: true }]);
        setReceipt({ id, read: false });
      }, sentAt);
      later(() => setReceipt({ id, read: true, at: new Date() }), sentAt + 650);
      later(() => setTyping(true), sentAt + 900);
      later(answer, sentAt + 900 + Math.max(800, Math.min(1700, item.a.length * 13)));
    },
    [busy, asked]
  );

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMessages([GREETING]);
    setAsked(new Set());
    setBusy(false);
    setTyping(false);
    setDraft('');
    setReceipt(null);
  };

  // A slight 3D tilt toward the pointer, and the glass glare follows it.
  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || reducedMotion() || !tiltRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tiltRef.current.style.transform = `rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
    tiltRef.current.style.setProperty('--gx', `${(60 - x * 60).toFixed(1)}%`);
  };
  const onLeave = () => {
    if (!tiltRef.current) return;
    tiltRef.current.style.transform = '';
    tiltRef.current.style.setProperty('--gx', '60%');
  };

  const allAsked = asked.size === FAQ_THREAD.length;
  const items = [...messages, ...(typing ? [{ id: 'typing', from: 'them', typing: true }] : [])];

  return (
    <div className="fq-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="fq-glow" aria-hidden="true" />
      <div ref={tiltRef} className="fq-tilt">
        <div className="fq-phone">
          <span className="fq-btn l action" aria-hidden="true" />
          <span className="fq-btn l vup" aria-hidden="true" />
          <span className="fq-btn l vdown" aria-hidden="true" />
          <span className="fq-btn r power" aria-hidden="true" />

          <div className="fq-screen">
            <div className="fq-glass" aria-hidden="true" />
            <div className="fq-island" aria-hidden="true" />

            <div className="fq-status" aria-hidden="true">
              <span>{clock(now)}</span>
              <StatusIcons />
            </div>

            <div className="fq-head">
              <div className="fq-head-row">
                <span className="fq-back" aria-hidden="true">
                  <ChevronLeft size={26} strokeWidth={2.4} style={{ marginLeft: -6 }} />
                </span>
                <div className="fq-who">
                  <span className="fq-ava">
                    <img src={LOGO_URL} alt="" />
                  </span>
                  <span className="fq-name">
                    Stelli <ChevronRight size={11} strokeWidth={2.6} />
                  </span>
                </div>
                <span className="fq-video" aria-hidden="true">
                  <Video size={24} strokeWidth={1.9} />
                </span>
              </div>
            </div>

            <div ref={threadRef} className="fq-thread" aria-live="polite" aria-label="Conversation with Stelli">
              <p className="fq-stamp">
                <b>Today</b> {clockFull(opened)}
              </p>
              {items.map((m, i) => {
                const next = items[i + 1];
                const tail = !next || next.from !== m.from;
                const prev = items[i - 1];
                const gap = prev && prev.from !== m.from;
                const cls = `fq-msg ${m.from === 'me' ? 'fq-me' : 'fq-them'}${tail ? ' tail' : ''}${gap ? ' gap' : ''}${m.sending ? ' sending' : ''}`;
                return (
                  <React.Fragment key={m.id}>
                    {m.typing ? (
                      <div className={`${cls} fq-typing`} aria-label="Stelli is typing">
                        <i />
                        <i />
                        <i />
                      </div>
                    ) : (
                      <div className={cls}>{m.text}</div>
                    )}
                    {receipt && receipt.id === m.id && (
                      <p className="fq-receipt">
                        {receipt.read ? (
                          <>
                            <b>Read</b> {clockFull(receipt.at)}
                          </>
                        ) : (
                          'Delivered'
                        )}
                      </p>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="fq-dock">
              <div className="fq-tray-label">
                <span>{allAsked ? "That's everything" : `Tap a question · ${FAQ_THREAD.length - asked.size} left`}</span>
                {asked.size > 0 && !busy && (
                  <button type="button" onClick={reset}>
                    Start over
                  </button>
                )}
              </div>
              <div className="fq-tray">
                {FAQ_THREAD.map((item) => {
                  const done = asked.has(item.q);
                  return (
                    <button
                      key={item.q}
                      type="button"
                      className={`fq-chip${done ? ' asked' : ''}${busy && !done ? ' busy' : ''}`}
                      disabled={done || busy}
                      aria-label={done ? `${item.q} (already asked)` : item.q}
                      onClick={() => ask(item)}
                    >
                      {done && <Check strokeWidth={2.8} />}
                      {item.q}
                    </button>
                  );
                })}
                {allAsked && (
                  <a className="fq-chip mail" href={`mailto:${EMAIL}`}>
                    Something else? Email us
                  </a>
                )}
              </div>

              <div className="fq-input" aria-hidden="true">
                <span className="fq-plus">
                  <Plus size={18} strokeWidth={2.4} />
                </span>
                <span className="fq-field">
                  {draft ? (
                    <span>
                      {draft}
                      <i className="caret" />
                    </span>
                  ) : (
                    <span className="ph">Message</span>
                  )}
                  {draft ? (
                    <span className="fq-send">
                      <ArrowUp size={16} strokeWidth={3} />
                    </span>
                  ) : (
                    <Mic size={18} strokeWidth={2} className="fq-mic" />
                  )}
                </span>
              </div>
            </div>
            <span className="fq-home" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
