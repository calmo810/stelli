import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MapPin, Star, X } from 'lucide-react';
import { accentOf, cssUrl, galleryImages, ratingLabel, taglineOf } from '@/lib/creatorBrowse';
import { displayNameOf } from '@/lib/profilePresets';

/** One big frame and two small ones: a clean collage instead of a long carousel. */
function collageFrames(images) {
  if (images.length === 1) return [{ url: images[0], className: 'col-span-3 row-span-2' }];
  if (images.length === 2) {
    return [
      { url: images[0], className: 'col-span-2 row-span-2' },
      { url: images[1], className: 'col-span-1 row-span-2' },
    ];
  }
  return [
    { url: images[0], className: 'col-span-2 row-span-2' },
    { url: images[1], className: 'col-span-1 row-span-1' },
    { url: images[2], className: 'col-span-1 row-span-1' },
  ];
}

/** A small numbered fact, so the numbers read at a glance. */
function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <b className="block text-[16px] font-semibold leading-tight text-white">{value}</b>
      <span className="text-[11px] leading-tight text-white/40">{label}</span>
    </div>
  );
}

/** The quick look: their work as one collage, who they are, and one way to book. */
export default function QuickViewSheet({ creator, onClose }) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef(null);
  const closeRef = useRef(null);

  const accent = accentOf(creator);
  const frames = collageFrames(galleryImages(creator));
  const name = displayNameOf(creator);
  const tagline = taglineOf(creator);
  const spots = (creator?.neighborhoods || []).filter(Boolean);
  const specialties = (creator?.specialties || []).filter(Boolean);
  const years = Number(creator?.years_experience) > 0 ? creator.years_experience : null;
  const reviews = Number(creator?.review_count || 0);
  const profilePath = `/creators/${creator?.slug || creator?.id}`;

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

      {/* A column, not one scrolling stack: the words scroll on their own and the
          booking bar sits below them, so it can never cover the name. */}
      <aside
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickview-title"
        className={`fixed inset-x-0 bottom-0 z-[61] flex max-h-[90vh] flex-col overflow-hidden rounded-t-[26px] border border-white/10 bg-surface transition-transform duration-[600ms] ease-[cubic-bezier(.6,0,.2,1)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-4 sm:max-h-none sm:w-[min(560px,calc(100%-32px))] sm:rounded-[26px] ${
          open ? 'translate-y-0' : 'translate-y-full sm:translate-x-[calc(100%+40px)] sm:translate-y-0'
        }`}
        style={{ '--acc': accent }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-[2] grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-ink/70 text-white backdrop-blur-[10px] transition-transform duration-300 hover:rotate-90"
        >
          <X className="h-[15px] w-[15px]" />
        </button>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* The collage. */}
          <div className="px-4 pt-4">
            <div className="relative">
              <div className="grid h-[212px] grid-cols-3 grid-rows-2 gap-1.5 overflow-hidden rounded-[18px] sm:h-[236px]">
                {frames.map((frame, i) => (
                  <div
                    key={`${frame.url}-${i}`}
                    className={`${frame.className} rounded-[10px] bg-surface-2 bg-cover bg-center transition-transform duration-700 hover:scale-[1.02]`}
                    style={{ backgroundImage: cssUrl(frame.url) }}
                  />
                ))}
              </div>

              <div
                className="absolute -bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold text-ink shadow-[0_10px_24px_-10px_rgba(0,0,0,.9)]"
                style={{ background: accent }}
              >
                <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                {reviews ? `${ratingLabel(creator).replace('★ ', '')} · ${reviews} review${reviews === 1 ? '' : 's'}` : 'New to Stelli'}
              </div>
            </div>
          </div>

          <div className="px-[22px] pb-5 pt-7">
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

        <div className="shrink-0 border-t border-white/10 bg-surface px-[22px] pb-[calc(18px+var(--safe-bottom))] pt-4">
          <Link
            to={`/book/${creator.id}`}
            className="block w-full rounded-2xl py-[16px] text-center text-[15px] font-semibold text-ink transition-transform duration-[250ms] hover:-translate-y-0.5"
            style={{ background: accent }}
          >
            {creator.booking_cta || 'Request a date'}
          </Link>
          <div className="mt-2 flex items-center justify-between gap-3">
            <Link to={profilePath} className="text-[12.5px] text-white/50 transition-colors hover:text-white">
              See the full profile
            </Link>
            <p className="text-right text-[11px] text-white/35">Protected on Stelli</p>
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
}