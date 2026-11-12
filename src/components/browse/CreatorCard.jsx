import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { accentOf, cardImages, cssUrl, ratingLabel, taglineOf } from '@/lib/creatorBrowse';
import { displayNameOf } from '@/lib/creatorProfile';

const CYCLE_MS = 1700;
const EASE_OUT = 'cubic-bezier(.2,.7,.2,1)';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * One creator, one 4/5 window. Hovering (or focusing) lights it up: the gallery
 * starts moving, the spots slide in and the card leans toward the cursor.
 */
export default function CreatorCard({ creator, index = 0, onOpen }) {
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState(false);
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState(() => new Set());
  const cardRef = useRef(null);
  const innerRef = useRef(null);
  const frameRef = useRef(0);
  const reduced = useRef(prefersReducedMotion());

  const images = cardImages(creator);
  const accent = accentOf(creator);
  const name = displayNameOf(creator);
  const tagline = taglineOf(creator);
  const face = creator?.profile_image;
  const initial = (String(name || '?').trim()[0] || '?').toUpperCase();
  /* Skip the badge when the card is already showing their portrait. */
  const showFace = !(face && images.length === 1 && images[0] === face);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || loadedImages.has(current)) return;
    setLoadedImages((loaded) => new Set(loaded).add(current));
  }, [inView, current, loadedImages]);

  useEffect(() => {
    if (!active || images.length < 2 || reduced.current) return undefined;
    const timer = setInterval(() => setCurrent((n) => (n + 1) % images.length), CYCLE_MS);
    return () => clearInterval(timer);
  }, [active, images.length]);

  const activate = () => {
    if (active) return;
    setActive(true);
    setCurrent(0);
  };

  const deactivate = () => {
    setActive(false);
    setCurrent(0);
    cancelAnimationFrame(frameRef.current);
    if (innerRef.current) innerRef.current.style.transform = '';
  };

  const onPointerMove = (event) => {
    if (event.pointerType !== 'mouse' || reduced.current || !cardRef.current || !innerRef.current) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      innerRef.current.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      innerRef.current.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
      innerRef.current.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    });
  };

  const open = () => onOpen(creator);

  return (
    <article
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`${name}, ${tagline}. Open quick view`}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
      onPointerEnter={(event) => event.pointerType === 'mouse' && activate()}
      onPointerLeave={deactivate}
      onPointerMove={onPointerMove}
      onFocus={activate}
      onBlur={deactivate}
      className={`relative aspect-[4/5] cursor-pointer rounded-[22px] outline-offset-4 transition-[opacity,transform] duration-700 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-[34px] opacity-0'
      }`}
      style={{
        perspective: 900,
        '--acc': accent,
        '--cycle': `${CYCLE_MS}ms`,
        transitionTimingFunction: EASE_OUT,
        transitionDelay: `${Math.min(index, 6) * 80}ms`,
      }}
    >
      <div
        ref={innerRef}
        className="absolute inset-0 overflow-hidden rounded-[22px] bg-[var(--st-card)] transition-[transform,box-shadow] duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: active
            ? `0 0 0 1px ${accent}, 0 34px 70px -28px ${accent}`
            : 'inset 0 1px 0 var(--line), inset 0 0 0 1px var(--line), 0 24px 48px -28px rgba(0,0,0,.7)',
        }}
      >
        {/* Photos sit in their own rounded mask so the zoom can't poke past the
            corners, while the card's glow outside stays visible. */}
        <div className="absolute inset-0 overflow-hidden rounded-[22px]" style={{ clipPath: 'inset(0 round 22px)' }}>
        {images.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className={`absolute inset-0 bg-cover bg-center ${i === current ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: loadedImages.has(i) ? cssUrl(url) : 'none',
              transform: active && i === current ? 'scale(1.07)' : 'scale(1.02)',
              transition: 'opacity .7s, transform 1.6s ' + EASE_OUT,
            }}
          />
        ))}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(12,16,32,.35) 0%, transparent 22%, transparent 42%, rgba(12,16,32,.94) 100%)',
          }}
        />
        <span aria-hidden="true" className={`sheen z-[2] ${active ? 'is-on' : ''}`} />
        </div>

        <div
          className={`absolute left-3.5 right-3.5 top-3.5 z-[3] flex gap-1 transition-opacity duration-300 ${
            active ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {images.map((url, i) => (
            <span key={`bar-${url}-${i}`} className="h-[2px] flex-1 overflow-hidden rounded bg-fill-2">
              <i
                key={`${current}-${i}`}
                className="block h-full bg-white"
                style={{
                  width: i < current ? '100%' : 0,
                  animation: active && i === current ? 'stelliFill var(--cycle) linear forwards' : 'none',
                }}
              />
            </span>
          ))}
        </div>

        {/* Their face in the corner, so the person behind the work is on the card. */}
        {showFace && (
          <div
            className="absolute left-4 top-[26px] z-[3] h-[54px] w-[54px] overflow-hidden rounded-full bg-fill-2"
            style={{
              transform: 'translateZ(40px)',
              boxShadow: `0 0 0 2.5px hsl(var(--ink)), 0 0 0 4px ${accent}, 0 14px 26px -10px rgba(0,0,0,.85)`,
            }}
          >
            {face ? (
              <img src={face} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center font-display text-[22px] text-fg-2">
                {initial}
              </div>
            )}
          </div>
        )}

        {creator?.is_sample && (
          <div className="absolute right-4 top-[26px] z-[3] st-kicker text-fg-3">
            Sample
          </div>
        )}

        <div className="absolute bottom-5 left-5 right-5 z-[3]" style={{ transform: 'translateZ(30px)' }}>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-bold tracking-[-0.03em] text-fg">{name}</span>
            <span className="text-[13px] font-medium" style={{ color: accent }}>
              {ratingLabel(creator)}
            </span>
          </div>

          <div className="mt-1 truncate text-[14px] text-fg-2">{tagline}</div>

          <div
            aria-hidden="true"
            className={`absolute bottom-0 right-0 grid h-11 w-11 place-items-center rounded-full transition-[transform,opacity] duration-[450ms] ${
              active ? 'rotate-0 scale-100 opacity-100' : '-rotate-45 scale-[.6] opacity-0'
            } [@media(hover:none)]:rotate-0 [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100`}
            style={{ background: accent, color: 'hsl(var(--ink))' }}
          >
            <ArrowRight className="h-[18px] w-[18px]" />
          </div>
        </div>
      </div>
    </article>
  );
}