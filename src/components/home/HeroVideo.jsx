import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Full-bleed hero still: Elon University.
const POSTER = 'https://commons.wikimedia.org/wiki/Special:FilePath/Alamance_Building,_Elon_University.jpg';

// Every phrase reads on from "Need a photographer for".
const PHRASES = [
  "your club's event?",
  'senior pics by the fountain?',
  'LinkedIn photos?',
  'headshots?',
  'your SGA campaign?',
  'big/little reveal?',
  'your a cappella concert?',
  'date party?',
  "your band's gig?",
  'graduation weekend?',
  'your small business?',
  'your dance recital?',
];

const TYPE_MS = 55;
const HOLD_MS = 1800;
const DELETE_MS = 25;
const GAP_MS = 250;
const START_MS = 600;

const EMPTY_TYPER = { index: 0, text: '', deleting: false, started: false };

const HIGHLIGHT = {
  display: 'inline',
  background: 'hsl(var(--neon-lime))',
  color: 'hsl(var(--ink))',
  padding: '.02em .22em .06em',
  borderRadius: 6,
  WebkitBoxDecorationBreak: 'clone',
  boxDecorationBreak: 'clone',
};

const TILT = {
  gridArea: '1 / 1',
  display: 'inline-block',
  transform: 'rotate(-1.5deg)',
  marginTop: '.18em',
};

// The highlighter settles at a different angle for each phrase, so it never
// sits at the same slant twice in a row.
const TILTS = [-1.6, 1.2, -0.9, 1.7, -1.3, 0.8];

const CARET = {
  display: 'inline-block',
  width: 2,
  height: '.8em',
  marginLeft: 2,
  verticalAlign: '-.05em',
  background: 'hsl(var(--ink))',
  animation: 'stelliCaretBlink 1s steps(1) infinite',
};

const BUTTON = {
  borderRadius: 980,
  padding: '15px 30px',
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function HeroVideo() {
  const reduced = usePrefersReducedMotion();
  const [typer, setTyper] = useState(EMPTY_TYPER);

  useEffect(() => {
    if (reduced) return undefined;
    const target = PHRASES[typer.index];
    let delay;
    let next;

    if (!typer.deleting) {
      if (typer.text.length < target.length) {
        delay = typer.started ? TYPE_MS : START_MS;
        next = { ...typer, text: target.slice(0, typer.text.length + 1), started: true };
      } else {
        delay = HOLD_MS;
        next = { ...typer, deleting: true };
      }
    } else if (typer.text.length > 0) {
      delay = DELETE_MS;
      next = { ...typer, text: typer.text.slice(0, -1) };
    } else {
      delay = GAP_MS;
      next = { ...typer, deleting: false, index: (typer.index + 1) % PHRASES.length };
    }

    const timer = setTimeout(() => setTyper(next), delay);
    return () => clearTimeout(timer);
  }, [typer, reduced]);

  const shownText = reduced ? PHRASES[0] : typer.text;
  const tilt = TILTS[typer.index % TILTS.length];
  const longest = PHRASES.reduce((a, phrase) => (phrase.length > a.length ? phrase : a), '');

  return (
    <section className="relative w-full overflow-hidden bg-ink" style={{ height: '100svh', minHeight: 600 }}>
      <style>{`@keyframes stelliCaretBlink { 50% { opacity: 0 } }`}</style>

      <img
        src={POSTER}
        alt="Elon University campus"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* ink scrim, bottom up */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, hsl(var(--ink) / 0.92) 0%, hsl(var(--ink) / 0.55) 50%, hsl(var(--ink) / 0.35) 100%)',
        }}
      />

      <div className="absolute inset-0 flex items-end justify-center text-center px-5 md:px-10 pb-16 sm:pb-[88px]">
        <div className="w-full max-w-[900px]">
          <h1
            className="font-display"
            style={{ fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.015em', fontSize: 'clamp(28px, 4.8vw, 68px)' }}
          >
            Need a photographer for
            <span className="sr-only">{` ${PHRASES.join(' ')}`}</span>

            <span aria-hidden className="grid">
              <span className="invisible" style={TILT}>
                <span style={HIGHLIGHT}>{`${longest} `}</span>
              </span>
              <span style={{ ...TILT, transform: `rotate(${tilt}deg)`, transition: 'transform 420ms ease-out' }}>
                <span style={HIGHLIGHT}>
                  <span style={{ fontStyle: 'italic' }}>{shownText}</span>
                  {!reduced && <span style={CARET} />}
                </span>
              </span>
            </span>
          </h1>

          <div className="flex flex-wrap justify-center" style={{ marginTop: 40, gap: 12 }}>
            <Link
              to="/creators"
              className="label-mono text-[11px] font-semibold w-full sm:w-auto text-center transition-transform duration-300 hover:-translate-y-0.5"
              style={{ ...BUTTON, background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
            >
              Book a creator
            </Link>
            <Link
              to="/register?role=creator"
              className="label-mono text-[11px] font-semibold w-full sm:w-auto text-center"
              style={{ ...BUTTON, border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
            >
              Shoot with Stelli
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}