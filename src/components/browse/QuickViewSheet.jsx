import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MapPin, X } from 'lucide-react';
import { accentOf, cssUrl, galleryImages, ratingLabel, taglineOf } from '@/lib/creatorBrowse';
import { displayNameOf } from '@/lib/profilePresets';

/* Where the smaller prints sit around the portrait. Literal classes only. */
const TILE_SLOTS = [
  'left-[3%] top-[3%] w-[74px] rotate-[-7deg] sm:w-[88px]',
  'right-[2%] top-[0%] w-[64px] rotate-[6deg] sm:w-[78px]',
  'left-[0%] top-[44%] w-[62px] rotate-[5deg] sm:w-[76px]',
  'right-[0%] top-[41%] w-[70px] rotate-[-6deg] sm:w-[90px]',
  'bottom-[0%] left-[23%] w-[58px] rotate-[4deg] sm:w-[70px]',
  'bottom-[2%] right-[21%] w-[62px] rotate-[-4deg] sm:w-[74px]',
];

/** A small numbered fact, so the numbers read at a glance. */
function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <b className="block text-[16px] font-semibold leading-tight text-white">{value}</b>
      <span className="text-[11px] leading-tight text-white/40">{label}</span>
    </div>
  );
}

/** The quick look: their face in the middle of their work, then one way to book. */
export default function QuickViewSheet({ creator, onClose }) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef(null);
  const closeRef = useRef(null);

  const accent = accentOf(creator);
  const images = galleryImages(creator);
  const name = displayNameOf(creator);
  const initial = (String(name || '?').trim()[0] || '?').toUpperCase();
  const tagline = taglineOf(creator);
  const spots = (creator?.neighborhoods || []).filter(Boolean);
  const specialties = (creator?.specialties || []).filter(Boolean);
  const years = Number(creator?.years_experience) > 0 ? creator.years_experience : null;
  const reviews = Number(creator?.review_count || 0);
  const profilePath = `/creators/${creator?.slug || creator?.id}`;
  const portrait = creator?.profile_image || images[0];
  const tiles = images.slice(0, TILE_SLOTS.length);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true));
    closeRef.current?.focus({ preventScroll: true });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusables = sheetRef.current.querySelectorAll('a[href], button');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[60] bg-[rgba(5,8,18,0.6)] backdrop-blur-[6px] transition-opacity duration-[450ms] ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickview-title"
        className={`fixed inset-x-0 bottom-0 z-[61] flex max-h-[92vh] flex-col overflow-hidden rounded-t-[26px] border border-white/10 bg-surface transition-transform duration-[600ms] ease-[cubic-bezier(.6,0,.2,1)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-4 sm:max-h-none sm:w-[min(560px,calc(100%-32px))] sm:rounded-[26px] ${
          open ? 'translate-y-0' : 'translate-y-full sm:translate-x-[calc(100%+40px)] sm:translate-y-0'
        }`}
        style={{ '--acc': accent }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-[3] grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-ink/70 text-white backdrop-blur-[10px] transition-transform duration-300 hover:rotate-90"
        >
          <X className="h-[15px] w-[15px]" />
        </button>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* The collage: their portrait in the middle, their work pinned around it. */}
          <div className="relative mx-auto h-[252px] w-full max-w-[460px] px-4 pt-2 sm:h-[280px]">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-[46px]"
              style={{ background: accent }}
            />

            {tiles.length > 1 &&
              tiles.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className={`absolute aspect-[3/4] overflow-hidden rounded-[10px] bg-surface-2 bg-cover bg-center ring-1 ring-white/10 shadow-[0_16px_34px_-16px_rgba(0,0,0,.9)] transition-transform duration-500 hover:rotate-0 hover:scale-[1.06] ${TILE_SLOTS[i]}`}
                  style={{ backgroundImage: cssUrl(url) }}
                />
              ))}

            <div
              className="absolute left-1/2 top-1/2 h-[148px] w-[148px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-surface-2 ring-[6px] ring-surface sm:h-[176px] sm:w-[176px]"
              style={{ boxShadow: `0 0 0 1.5px ${accent}, 0 26px 60px -22px rgba(0,0,0,.95)` }}
            >
              {portrait ? (
                <img
                  src={portrait}
                  alt={name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full w-full place-items-center font-display text-[54px] text-white/60">
                  {initial}
                </div>
              )}
            </div>
          </div>

          <div className="px-[22px] pb-5 pt-4">
            <p className="label-mono text-[10px] text-white/40">
              {creator?.market === 'ELON' || !creator?.market ? 'Elon' : creator.market} · Photographer
            </p>
            <h2
              id="quickview-title"
              className="mt-1 text-[30px] font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-[32px]"
            >
              {name}
            </h2>
            <p className="mt-1.5 text-[14px] leading-snug text-white/50">{tagline}</p>

            <div className="mt-4 flex items-center gap-6 border-y border-white/10 py-3">
              <Fact label={reviews ? 'Rating' : 'Status'} value={ratingLabel(creator)} />
              <Fact label="Shoots" value={Number(creator?.completed_shoots) > 0 ? creator.completed_shoots : '—'} />
              <Fact label="Shooting" value={years ? `${years} yrs` : '—'} />
              {spots.length > 0 && (
                <div className="ml-auto flex min-w-0 items-center gap-1 text-[11px] text-white/45">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{spots[0]}</span>
                </div>
              )}
            </div>

            {creator?.bio && (
              <p className="mt-4 text-[14px] leading-[1.6] text-white/75">{creator.bio}</p>
            )}

            {creator?.prompt_answer && (
              <div className="mt-3.5 rounded-2xl border border-dashed border-white/15 px-4 py-3">
                <p className="label-mono text-[10px] text-white/40">{creator.prompt_question}</p>
                <p className="mt-1 font-display italic text-[19px] leading-snug text-white">
                  {creator.prompt_answer}
                </p>
              </div>
            )}

            {specialties.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {specialties.slice(0, 6).map((specialty) => (
                  <span
                    key={specialty}
                    className="whitespace-nowrap rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] text-white/70"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-surface px-[22px] pb-[calc(16px+var(--safe-bottom))] pt-4">
          <div className="flex items-center gap-2">
            <Link
              to={`/book/${creator.id}`}
              className="flex-1 rounded-2xl py-[15px] text-center text-[15px] font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: accent }}
            >
              {creator.booking_cta || 'Request a date'}
            </Link>
            <Link
              to={profilePath}
              className="shrink-0 whitespace-nowrap rounded-2xl border border-white/15 px-4 py-[15px] text-center text-[13px] font-semibold text-white/85 transition-colors hover:border-white/35 hover:text-white"
            >
              See full profile
            </Link>
          </div>
          <p className="mt-2 text-center text-[11px] text-white/35">Payments and messaging stay protected on Stelli.</p>
        </div>
      </aside>
    </>,
    document.body
  );
}