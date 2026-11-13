import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SmoothImage from '@/components/shared/SmoothImage';

// Full-bleed hero still: Elon University. Served at 4K wide, with smaller
// renditions for phones so they stay fast without going soft.
const POSTER_BASE = 'https://commons.wikimedia.org/wiki/Special:FilePath/Alamance_Building,_Elon_University.jpg';
const POSTER = `${POSTER_BASE}?width=3840`;
const POSTER_SRCSET = [1280, 1920, 2560, 3840].map((w) => `${POSTER_BASE}?width=${w} ${w}w`).join(', ');

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

const HERO_PATHS = [
  {
    to: '/creators',
    label: 'Book a creator',
    background: 'linear-gradient(135deg, hsl(75 100% 72%), hsl(var(--neon-lime)) 58%, hsl(72 92% 49%))',
    color: 'hsl(var(--ink))',
    border: 'hsl(var(--neon-lime))',
    shadow: '0 14px 26px -16px hsl(var(--neon-lime) / .62), inset 0 1px 0 hsl(0 0% 100% / .44)',
    width: 190,
  },
  {
    to: '/register?role=creator',
    label: 'Shoot with Stelli',
    background: 'linear-gradient(135deg, hsl(228 42% 16% / .92), hsl(var(--ink) / .86))',
    color: 'hsl(var(--white))',
    border: 'hsl(0 0% 100% / .44)',
    shadow: '0 14px 28px -20px hsl(var(--ink) / .9), inset 0 1px 0 hsl(0 0% 100% / .12)',
    width: 204,
  },
];

const HIGHLIGHT = {
  display: 'inline',
  background: 'hsl(var(--neon-lime))',
  color: 'hsl(var(--ink))',
  padding: '.02em .22em .06em',
  borderRadius: 16,
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
  const heroRef = useRef(null);
  const parallaxRef = useRef(null);

  // The photo drifts down slightly as the page scrolls; the copy stays put.
  useEffect(() => {
    if (reduced) return undefined;
    const hero = heroRef.current;
    if (!hero) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const heroH = hero.offsetHeight;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate3d(0, ${Math.min(window.scrollY, heroH) * 0.32}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

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
    <section
      ref={heroRef}
      data-hero
      className="relative w-full overflow-hidden bg-ink"
      style={{ height: '100svh', minHeight: 600 }}
    >
      <style>{`@keyframes stelliCaretBlink { 50% { opacity: 0 } }`}</style>

      <div ref={parallaxRef} className="absolute inset-0 will-change-transform">
        <div className="absolute inset-0 ken-burns">
          <SmoothImage
            priority
            src={POSTER}
            srcSet={POSTER_SRCSET}
            sizes="100vw"
            alt="Elon University campus"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Layered scrim: a deep floor for the copy, a soft vignette for depth,
          and a faint lime bloom so the photo sits inside the brand. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(to top, hsl(var(--ink)) 0%, hsl(var(--ink) / 0.86) 18%, hsl(var(--ink) / 0.5) 48%, hsl(var(--ink) / 0.28) 78%, hsl(var(--ink) / 0.45) 100%)',
            'radial-gradient(120% 90% at 50% 40%, transparent 55%, hsl(var(--ink) / 0.55) 100%)',
            'radial-gradient(60% 40% at 50% 100%, hsl(var(--neon-lime) / 0.07), transparent 70%)',
          ].join(', '),
        }}
      />

      <div className="absolute inset-0 flex flex-col justify-center px-5 text-center md:px-10 pb-[calc(var(--tabbar-h)+14px)] pt-[calc(var(--safe-top)+72px)] sm:flex-row sm:items-end sm:justify-center sm:pb-[64px] sm:pt-0">
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

          <div className="mx-auto mt-9 flex w-full max-w-[320px] flex-col items-stretch justify-center gap-3 sm:mt-[138px] sm:max-w-none sm:flex-row sm:items-center sm:gap-2.5">
            {HERO_PATHS.map((path) => (
              <Link
                key={path.to}
                to={path.to}
                className="group relative flex min-h-[54px] w-full items-center justify-center overflow-hidden rounded-full border px-5 text-center transition-[transform,box-shadow,filter] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:scale-[1.012] hover:brightness-105 active:translate-y-0 sm:min-h-[44px] sm:w-[var(--cta-width)]"
                style={{
                  '--cta-width': `${path.width}px`,
                  background: path.background,
                  borderColor: path.border,
                  boxShadow: path.shadow,
                  color: path.color,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'linear-gradient(110deg, transparent 30%, hsl(0 0% 100% / .16) 50%, transparent 70%)' }}
                />
                <span className="relative text-[11.5px] font-bold uppercase tracking-[0.12em]">
                  {path.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}