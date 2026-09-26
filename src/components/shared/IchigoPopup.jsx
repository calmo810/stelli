import React, { useEffect, useRef, useState } from 'react';
import IchigoCard from './IchigoCard';

/**
 * 一期一会 in the footer: a slow lime dot, the phrase, and a note it opens.
 * Mouse opens it on hover, a finger on tap, Tab on focus — Esc or a tap
 * anywhere else closes it.
 */
const CARD_WIDTH = 330;
const EDGE = 16;

export default function IchigoPopup() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(0);
  const wrapRef = useRef(null);
  const lastPointer = useRef('mouse');

  /** Keep the card on screen: it is anchored to the phrase, so slide it right
   *  when the phrase sits too close to the left edge (a wrapped phone footer). */
  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const { right } = el.getBoundingClientRect();
    const width = Math.min(CARD_WIDTH, window.innerWidth - EDGE * 2);
    const missing = Math.max(0, width - (right - EDGE));
    const room = Math.max(0, window.innerWidth - EDGE - right);
    setNudge(Math.min(missing, room));
  };

  useEffect(() => {
    if (!open) return;
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative z-[100]"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? 'ichigo-note' : undefined}
        onPointerDown={(event) => {
          lastPointer.current = event.pointerType;
        }}
        onClick={(event) => {
          // A mouse already opened it on hover; a finger or the keyboard toggles here.
          if (event.detail > 0 && lastPointer.current === 'mouse') return;
          setOpen((wasOpen) => !wasOpen);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (!wrapRef.current?.contains(event.relatedTarget)) setOpen(false);
        }}
        className="flex items-center gap-2 text-[12px] text-white/35 transition-colors hover:text-white/70"
      >
        <span aria-hidden className="ichigo-dot h-1.5 w-1.5 shrink-0 rounded-full bg-neon-lime" />
        <span className="text-[13px]">一期一会</span>
        <span className="border-b border-dashed border-white/30 pb-px">one time, one meeting</span>
      </button>

      {open && (
        <div className="absolute bottom-full z-[100] pb-3" style={{ right: -nudge }}>
          <IchigoCard pointerRight={nudge + 28} />
        </div>
      )}
    </div>
  );
}