import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMarket } from '@/lib/market';

// Paste the uploaded hero video URL (stelli-hero.mp4) between the quotes.
const HERO_VIDEO_URL = '';
// Held final frame + fallback still (bright daylight, Manhattan).
const NYC_HERO_POSTER = 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=2000&q=80';
const ELON_HERO_POSTER = 'https://commons.wikimedia.org/wiki/Special:FilePath/Alamance_Building,_Elon_University.jpg';

const INK = '#0a0f1e';
const NEON = { lime: '#C4F82A', magenta: '#F82AC4', cyan: '#2AE8F8' };

// Every phrase starts lowercase so it reads on from "Need a photographer for…".
const PHRASES = {
  ELON: [
    { text: 'senior pics at the fountain?', color: 'lime' },
    { text: 'big/little reveal?', color: 'magenta' },
    { text: 'your a cappella concert?', color: 'cyan' },
    { text: 'a photo dump actually worth posting?', color: 'lime' },
    { text: 'musical theatre headshots?', color: 'magenta' },
    { text: "LinkedIn photos that don't look like LinkedIn photos?", color: 'cyan' },
    { text: 'date party?', color: 'lime' },
    { text: "your band's gig?", color: 'magenta' },
    { text: 'your graduation weekend?', color: 'cyan' },
    { text: "your club's next big event?", color: 'lime' },
    { text: 'a campaign for your small business?', color: 'magenta' },
    { text: 'your dance recital?', color: 'cyan' },
  ],
  NYC: [
    { text: 'a birthday dinner?', color: 'lime' },
    { text: "your band's show?", color: 'magenta' },
    { text: 'a rooftop party?', color: 'cyan' },
    { text: 'headshots?', color: 'lime' },
    { text: 'a brand launch?', color: 'magenta' },
    { text: "LinkedIn photos that don't look like LinkedIn photos?", color: 'cyan' },
  ],
};

const COORDS = { ELON: '36.10° N · 79.51° W', NYC: '40.71° N · 74.01° W' };

const TYPE_MS = 55;
const HOLD_MS = 1800;
const DELETE_MS = 25;
const GAP_MS = 200;

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='220' height='220' filter='url(%23n)'/></svg>\")";

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut', delay: i * 0.08 },
  }),
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function useMinWidth(px) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(min-width: ${px}px)`).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [px]);
  return matches;
}

function FrameCorner({ position }) {
  const border = '1px solid rgba(255,255,255,0.45)';
  const style = { width: 22, height: 22, position: 'absolute' };
  if (position === 'tl') Object.assign(style, { top: 0, left: 0, borderTop: border, borderLeft: border });
  if (position === 'tr') Object.assign(style, { top: 0, right: 0, borderTop: border, borderRight: border });
  if (position === 'bl') Object.assign(style, { bottom: 0, left: 0, borderBottom: border, borderLeft: border });
  if (position === 'br') Object.assign(style, { bottom: 0, right: 0, borderBottom: border, borderRight: border });
  return <span style={style} />;
}

function PhraseIndex({ phrases, activeIndex }) {
  return (
    <div aria-hidden style={{ width: 280, borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 20 }}>
      <p className="label-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Index — {phrases.length} moments
      </p>
      <ul className="mt-4 space-y-2">
        {phrases.map((phrase, i) => (
          <li
            key={phrase.text}
            className="flex items-baseline gap-3 font-mono text-[10px] transition-[color,transform] duration-300"
            style={{
              color: i === activeIndex ? NEON[phrase.color] : 'rgba(255,255,255,0.32)',
              transform: i === activeIndex ? 'translateX(6px)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <span className="min-w-0 truncate">{phrase.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HeroVideo() {
  const { activeMarket } = useMarket();
  const poster = activeMarket.id === 'ELON' ? ELON_HERO_POSTER : NYC_HERO_POSTER;
  const reduced = usePrefersReducedMotion();
  const showIndex = useMinWidth(1100);
  const [revealed, setRevealed] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const phrases = PHRASES[activeMarket.id] || PHRASES.ELON;
  const longest = phrases.reduce((a, p) => (p.text.length > a.length ? p.text : a), '');

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('typing');
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 640;

    if (!HERO_VIDEO_URL || isReduced || small || activeMarket.id === 'ELON') {
      setShowVideo(false);
      setRevealed(true);
      return;
    }

    setShowVideo(true);
    const safety = setTimeout(() => setRevealed(true), 14000);
    return () => clearTimeout(safety);
  }, [activeMarket.id]);

  // Switching market restarts the typewriter at the first phrase of that list.
  useEffect(() => {
    setPhraseIndex(0);
    setText('');
    setPhase('typing');
  }, [activeMarket.id]);

  useEffect(() => {
    if (reduced) return;
    const current = phrases[phraseIndex].text;
    const delay = phase === 'typing' ? TYPE_MS : phase === 'holding' ? HOLD_MS : phase === 'deleting' ? DELETE_MS : GAP_MS;

    const timer = setTimeout(() => {
      if (phase === 'typing') {
        if (text.length < current.length) setText(current.slice(0, text.length + 1));
        else setPhase('holding');
      } else if (phase === 'holding') {
        setPhase('deleting');
      } else if (phase === 'deleting') {
        if (text.length > 0) setText(current.slice(0, text.length - 1));
        else setPhase('pausing');
      } else {
        setPhraseIndex((i) => (i + 1) % phrases.length);
        setPhase('typing');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, phase, phraseIndex, phrases, reduced]);

  // Camera flash the moment a phrase finishes typing.
  useEffect(() => {
    if (reduced || phase !== 'holding') return;
    setFlashKey((k) => k + 1);
  }, [phase, phraseIndex, reduced]);

  const shownIndex = reduced ? 0 : phraseIndex;
  const shownText = reduced ? phrases[0].text : text;
  const color = NEON[reduced ? phrases[0].color : phrases[phraseIndex].color];

  return (
    <section className="relative w-full overflow-hidden bg-ink" style={{ height: '100svh', minHeight: 580 }}>
      <style>{`
        @keyframes stelliCursorBlink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
        @keyframes stelliDotPulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
      `}</style>

      <img src={poster} alt={activeMarket.id === 'ELON' ? 'Elon University campus' : ''} className="absolute inset-0 w-full h-full object-cover" />

      {showVideo && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={HERO_VIDEO_URL}
          poster={poster}
          autoPlay
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          onEnded={() => setRevealed(true)}
          onError={() => setRevealed(true)}
        />
      )}

      {/* edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(125% 95% at 50% 45%, transparent 55%, rgba(10,15,30,0.6) 100%)' }}
      />

      {/* scrim: ink from the bottom up */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ background: `linear-gradient(to top, ${INK}f5 0%, ${INK}b3 50%, ${INK}73 100%)` }}
      />

      {/* film grain */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.07, backgroundImage: GRAIN }} />

      {/* coloured glow behind the headline */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none transition-colors duration-[800ms]"
        style={{
          color,
          opacity: 0.14,
          background: 'radial-gradient(70% 60% at 16% 84%, currentColor 0%, transparent 72%)',
        }}
      />

      {/* viewfinder frame */}
      <div aria-hidden className="absolute left-5 right-5 md:left-10 md:right-10 pointer-events-none" style={{ top: 84, bottom: 28 }}>
        <FrameCorner position="tl" />
        <FrameCorner position="tr" />
        <FrameCorner position="bl" />
        <FrameCorner position="br" />

        <div className="absolute left-0 right-0 flex items-center justify-between" style={{ top: 10 }}>
          <span className="flex items-center gap-2">
            <span
              className="inline-block"
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                background: NEON.magenta,
                boxShadow: `0 0 8px ${NEON.magenta}`,
                animation: reduced ? 'none' : 'stelliDotPulse 1.4s ease-in-out infinite',
              }}
            />
            <span className="label-mono text-[9px] text-white/50">Stelli — {activeMarket.label}</span>
          </span>
          <span className="label-mono text-[9px] text-white/50 hidden sm:block">{COORDS[activeMarket.id] || COORDS.ELON}</span>
          <span className="label-mono text-[9px] text-white/50">
            FR {String(shownIndex + 1).padStart(2, '0')}/{String(phrases.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 flex items-end">
        <div className="max-w-[1500px] mx-auto w-full px-5 md:px-10 pb-14 md:pb-20">
          <motion.div
            variants={rise}
            initial="hidden"
            animate={revealed ? 'show' : 'hidden'}
            custom={0}
            className="flex items-center gap-3 mb-5"
          >
            <span aria-hidden style={{ width: 28, height: 1, background: NEON.lime }} />
            <span className="label-mono text-[10px]" style={{ color: NEON.lime, textShadow: '0 2px 40px rgba(0,0,0,0.6)' }}>
              {activeMarket.label} — 2026
            </span>
          </motion.div>

          <div className="flex items-end justify-between gap-10">
            <div className="min-w-0 flex-1">
              <motion.h1
                variants={rise}
                initial="hidden"
                animate={revealed ? 'show' : 'hidden'}
                custom={1}
                className="font-heading"
                style={{ textShadow: '0 2px 40px rgba(0,0,0,0.55)' }}
              >
                <span
                  className="block font-medium"
                  style={{ fontSize: 'clamp(30px, 4.6vw, 64px)', lineHeight: 1, color: 'rgba(255,255,255,0.92)', marginBottom: 10 }}
                >
                  Need a photographer for…
                </span>

                <span
                  className="block"
                  style={{
                    fontSize: 'clamp(38px, 6.4vw, 104px)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.02,
                    marginBottom: 36,
                  }}
                >
                  <span className="grid" style={{ gridTemplateColumns: '1fr' }}>
                    <span aria-hidden className="invisible" style={{ gridArea: '1 / 1', overflowWrap: 'break-word' }}>
                      {longest}
                    </span>
                    <span aria-hidden style={{ gridArea: '1 / 1', overflowWrap: 'break-word' }}>
                      <span style={{ color, textShadow: `0 0 34px ${color}66` }}>{shownText}</span>
                      <span
                        className="inline-block align-baseline"
                        style={{
                          width: '0.08em',
                          height: '0.82em',
                          marginLeft: '0.04em',
                          background: color,
                          animation: reduced ? 'none' : 'stelliCursorBlink 0.9s linear infinite',
                        }}
                      />
                    </span>
                  </span>
                </span>

                <span className="sr-only">Need a photographer for… {phrases.map((p) => p.text).join(' ')}</span>
              </motion.h1>

              <motion.div
                variants={rise}
                initial="hidden"
                animate={revealed ? 'show' : 'hidden'}
                custom={2}
                className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/creators"
                    className="label-mono text-[11px] font-semibold px-8 py-4 text-center transition-transform duration-300 hover:-translate-y-0.5"
                    style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
                  >
                    Book a creator
                  </Link>
                  <Link
                    to="/register?role=creator"
                    className="label-mono text-[11px] font-semibold px-8 py-4 text-center border transition-colors duration-300"
                    style={{ borderColor: 'hsl(var(--neon-cyan))', color: 'hsl(var(--neon-cyan))', borderRadius: 4 }}
                  >
                    Shoot with Stelli
                  </Link>
                </div>
                <p className="label-mono text-[9px] text-white/40">You're the star — we just bring the camera.</p>
              </motion.div>
            </div>

            {showIndex && (
              <motion.div variants={rise} initial="hidden" animate={revealed ? 'show' : 'hidden'} custom={3} className="shrink-0">
                <PhraseIndex phrases={phrases} activeIndex={shownIndex} />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* camera flash */}
      {flashKey > 0 && !reduced && (
        <motion.div
          key={flashKey}
          className="absolute inset-0 pointer-events-none"
          style={{ background: '#ffffff', zIndex: 30 }}
          initial={{ opacity: 0.18 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}
    </section>
  );
}