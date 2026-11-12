import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MapPin, X } from 'lucide-react';
import { accentOf, galleryImages, ratingLabel, taglineOf } from '@/lib/creatorBrowse';
import { displayNameOf } from '@/lib/creatorProfile';
import SmoothImage from '@/components/shared/SmoothImage';

/** A small numbered fact, so the numbers read at a glance. */
function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <b className="block text-[16px] font-semibold leading-tight text-white">{value}</b>
      <span className="text-[11px] leading-tight text-white/40">{label}</span>
    </div>
  );
}

/** The quick look: their work at full size, their face beside their name, then one way to book. */
export default function QuickViewSheet({ creator, onClose }) {
  const [open, setOpen] = useState(false);
  const [lead, setLead] = useState(0);
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
  const portrait = creator?.profile_image;
  /* The photo in the big slot, then the next two beside it. */
  const order = images.map((_, i) => (lead + i) % images.length);
  const sides = order.slice(1, 3);
  const leadSpan = images.length === 1 ? 'col-span-3 row-span-2' : 'col-span-2 row-span-2';

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
          {/* The work, large: one lead photo with the next two beside it. */}
          <div className="grid aspect-[6/5] grid-cols-3 grid-rows-2 gap-1.5 p-2.5 pb-0">
            <div className={`relative min-h-0 overflow-hidden rounded-[18px] bg-surface-2 ${leadSpan}`}>
              <SmoothImage
                key={images[lead]}
                src={images[lead]}
                alt={`Photo ${lead + 1} of ${images.length} by ${name}`}
                priority
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            {sides.map((i) => (
              <button
                key={`${images[i]}-${i}`}
                type="button"
                onClick={() => setLead(i)}
                aria-label={`Show photo ${i + 1} larger`}
                className={`group relative min-h-0 overflow-hidden rounded-[18px] bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acc)] ${
                  sides.length === 1 ? 'row-span-2' : ''
                }`}
              >
                <SmoothImage
                  src={images[i]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              </button>
            ))}
          </div>

          {/* Their face, overlapping the work, with the rest of the set to flip through. */}
          <div className="relative z-[1] -mt-9 flex items-end justify-between gap-3 px-[22px]">
            <div
              className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-full bg-surface-2"
              style={{
                boxShadow: `0 0 0 5px hsl(var(--surface)), 0 0 0 6.5px ${accent}, 0 18px 36px -14px rgba(0,0,0,.9)`,
              }}
            >
              {portrait ? (
                <img src={portrait} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center font-display text-[30px] text-white/60">
                  {initial}
                </div>
              )}
            </div>

            {images.length > 3 && (
              <div className="flex min-w-0 gap-1.5 pb-0.5" aria-label="All photos">
                {images.map((url, i) => (
                  <button
                    key={`thumb-${url}-${i}`}
                    type="button"
                    onClick={() => setLead(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={i === lead}
                    className={`relative aspect-[4/5] w-9 shrink-0 overflow-hidden rounded-[8px] bg-surface-2 transition-[opacity,transform] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acc)] sm:w-10 ${
                      i === lead ? '-translate-y-1 opacity-100' : 'opacity-50 hover:opacity-90'
                    }`}
                    style={i === lead ? { boxShadow: `0 0 0 1.5px ${accent}` } : undefined}
                  >
                    <img src={url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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