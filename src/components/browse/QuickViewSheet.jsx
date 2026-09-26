import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { accentOf, cssUrl, galleryImages, ratingLabel, taglineOf } from '@/lib/creatorBrowse';
import { displayNameOf } from '@/lib/profilePresets';

/** The quick look: a creator's work, their story and one way to book them. */
export default function QuickViewSheet({ creator, onClose }) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef(null);
  const closeRef = useRef(null);

  const accent = accentOf(creator);
  const images = galleryImages(creator);
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

      <aside
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickview-title"
        className={`fixed inset-x-0 bottom-0 z-[61] max-h-[88vh] overflow-y-auto overscroll-contain rounded-t-[28px] border border-white/10 bg-surface transition-transform duration-[600ms] ease-[cubic-bezier(.6,0,.2,1)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-4 sm:max-h-none sm:w-[min(520px,calc(100%-32px))] sm:rounded-[28px] ${
          open ? 'translate-y-0' : 'translate-y-full sm:translate-x-[calc(100%+40px)] sm:translate-y-0'
        }`}
        style={{ '--acc': accent }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="sticky top-3.5 z-[2] float-right mr-3.5 mt-3.5 grid h-[38px] w-[38px] place-items-center rounded-full border border-white/10 bg-ink/60 text-white backdrop-blur-[10px] transition-transform duration-300 hover:rotate-90"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="no-scrollbar clear-both flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-[22px] pb-1 pt-[18px]">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="aspect-[4/5] flex-[0_0_78%] snap-center rounded-[18px] bg-surface-2 bg-cover bg-center"
              style={{ backgroundImage: cssUrl(url) }}
            />
          ))}
        </div>

        <div className="px-[26px] pb-[30px] pt-[22px]">
          <h2 id="quickview-title" className="text-[36px] font-bold tracking-[-0.035em] text-white">
            {name}
          </h2>
          <p className="mt-1 text-[15px] text-white/45">
            {[tagline, spots.join(', ')].filter(Boolean).join(' · ')}
          </p>

          <div className="my-[22px] grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-surface-2 p-3.5">
              <b className="block text-[18px] font-semibold text-white">{ratingLabel(creator)}</b>
              <span className="text-[12px] text-white/45">
                {reviews ? `${reviews} review${reviews === 1 ? '' : 's'}` : 'On Stelli'}
              </span>
            </div>
            <div className="rounded-2xl bg-surface-2 p-3.5">
              <b className="block text-[18px] font-semibold text-white">
                {years ? `${years} yrs` : '—'}
              </b>
              <span className="text-[12px] text-white/45">Shooting</span>
            </div>
          </div>

          {creator?.bio && <p className="text-[15px] leading-[1.6] text-white/80">{creator.bio}</p>}

          {creator?.prompt_answer && (
            <div className="mt-[22px] rounded-2xl border border-dashed border-white/15 p-[18px]">
              <p className="label-mono text-[11px] text-white/45">{creator.prompt_question}</p>
              <p className="mt-1.5 font-display italic text-[24px] leading-tight text-white">
                {creator.prompt_answer}
              </p>
            </div>
          )}

          {specialties.length > 0 && (
            <div className="mt-[22px] flex flex-wrap gap-1.5">
              {specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="whitespace-nowrap rounded-full bg-surface-2 px-2.5 py-1.5 text-[12px]"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          className="sticky bottom-0 px-[26px] pb-[22px] pt-4"
          style={{ background: 'linear-gradient(180deg, transparent, hsl(var(--surface)) 30%)' }}
        >
          <Link
            to={`/book/${creator.id}`}
            className="block w-full rounded-2xl py-[18px] text-center text-[16px] font-semibold text-ink transition-transform duration-[250ms] hover:-translate-y-0.5"
            style={{ background: accent }}
          >
            {creator.booking_cta || 'Request a date'}
          </Link>
          <Link
            to={profilePath}
            className="mt-3 block text-center text-[13px] text-white/45 transition-colors hover:text-white"
          >
            See the full profile
          </Link>
          <p className="mt-2.5 text-center text-[12px] text-white/45">
            Payments and messaging stay protected on Stelli.
          </p>
        </div>
      </aside>
    </>,
    document.body
  );
}