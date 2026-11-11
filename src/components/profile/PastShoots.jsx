import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Images, ShieldCheck, Sparkles, Star, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PhotoViewer } from './PrintWall';
import './pastShoots.css';

const NEW_FOR_DAYS = 21;

function Stars({ rating = 0, size = 'sm' }) {
  const r = Math.round(rating);
  return (
    <span className={`ps-stars ps-stars-${size}`} role="img" aria-label={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={n <= r ? '' : 'off'} strokeWidth={0} />
      ))}
    </span>
  );
}

function monthLabel(date) {
  if (!date) return '';
  const d = new Date(`${String(date).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const titleFor = (shoot) => {
  const t = (shoot.event_type || '').replace(/_/g, ' ').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Stelli shoot';
};

const isNew = (shoot) => {
  const t = shoot.shared_at ? new Date(shoot.shared_at).getTime() : 0;
  return t > 0 && Date.now() - t < NEW_FOR_DAYS * 86_400_000;
};

/** Photo collage on a card: one, two, or one large with two beside it. */
function Collage({ photos }) {
  const shown = photos.slice(0, 3);
  return (
    <div className={`ps-collage n${shown.length}`}>
      {shown.map((src, i) => (
        <span key={src} className="ps-ph" style={/** @type {React.CSSProperties} */ ({ '--d': `${i * 70}ms` })}>
          <img src={src} alt="" loading="lazy" decoding="async" />
        </span>
      ))}
    </div>
  );
}

function ShootCard({ shoot, index, onOpen }) {
  const fresh = isNew(shoot);
  const { review } = shoot;
  return (
    <button
      type="button"
      className={`ps-card ${fresh ? 'is-new' : ''}`}
      style={/** @type {React.CSSProperties} */ ({ '--i': index })}
      onClick={(e) => onOpen(shoot.id, e.currentTarget)}
      aria-label={`Open the ${titleFor(shoot)} shoot from ${monthLabel(shoot.event_date) || 'Stelli'}`}
    >
      <div className="ps-media">
        <Collage photos={shoot.photos} />
        <div className="ps-shade" aria-hidden="true" />
        <div className="ps-tags">
          {fresh ? (
            <span className="ps-new">
              <Sparkles strokeWidth={2.4} /> Just shared
            </span>
          ) : (
            <span />
          )}
          <span className="ps-count">
            <Images strokeWidth={2.2} /> {shoot.photos.length}
          </span>
        </div>
        <div className="ps-cap">
          <b>{titleFor(shoot)}</b>
          <span>{monthLabel(shoot.event_date)}</span>
        </div>
      </div>

      <div className="ps-body">
        {review?.rating > 0 && <Stars rating={review.rating} />}
        {review?.comment ? (
          <q className="ps-quote">{review.comment}</q>
        ) : (
          <p className="ps-plain">Booked, shot and delivered through Stelli.</p>
        )}
        <div className="ps-by">
          <span className="ps-initial" aria-hidden="true">
            {shoot.client_first_name.charAt(0)}
          </span>
          <span className="ps-name">{shoot.client_first_name}</span>
          <span className="ps-verified">
            <BadgeCheck strokeWidth={2.2} /> Verified booking
          </span>
        </div>
      </div>
    </button>
  );
}

function ShootSheet({ shoot, firstName, onClose, onPhoto }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const n = Math.min(shoot.photos.length, 6);
  const { review } = shoot;
  return (
    <div
      className="ps-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ps-sheet-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ps-sheet-in">
        <div className="ps-sheet-head">
          <div>
            <p className="ps-eyebrow">
              <ShieldCheck strokeWidth={2.2} /> Shared with permission
            </p>
            <h3 id="ps-sheet-title">{titleFor(shoot)}</h3>
            <p className="ps-meta">
              {[monthLabel(shoot.event_date), `Shot by ${firstName} for ${shoot.client_first_name}`, 'Booked through Stelli']
                .filter(Boolean)
                .join('  ·  ')}
            </p>
          </div>
          <button ref={closeRef} type="button" className="ps-close" aria-label="Close shoot" onClick={onClose}>
            <X strokeWidth={2.4} />
          </button>
        </div>

        <div className={`ps-mosaic m${n}`}>
          {shoot.photos.slice(0, 6).map((src, i) => (
            <button
              key={src}
              type="button"
              className="ps-tile"
              style={/** @type {React.CSSProperties} */ ({ '--d': `${80 + i * 60}ms` })}
              onClick={(e) => onPhoto(shoot.photos, i, e.currentTarget)}
              aria-label={`View photo ${i + 1} of ${shoot.photos.length}`}
            >
              <img src={src} alt="" decoding="async" />
            </button>
          ))}
        </div>

        {review && (review.rating > 0 || review.comment) && (
          <figure className="ps-review">
            <span className="ps-mark" aria-hidden="true">“</span>
            {review.rating > 0 && <Stars rating={review.rating} size="lg" />}
            {review.comment && (
              <blockquote>
                <p>{review.comment}</p>
              </blockquote>
            )}
            <figcaption>
              <span className="ps-initial" aria-hidden="true">
                {shoot.client_first_name.charAt(0)}
              </span>
              <span>
                <b>{shoot.client_first_name}</b>
                <small>Verified Stelli client</small>
              </span>
            </figcaption>
          </figure>
        )}

        <p className="ps-sheet-foot">
          <ShieldCheck strokeWidth={2} />
          {firstName} and {shoot.client_first_name} both agreed to share this shoot. Either of them can take it down at any time.
        </p>
      </div>
    </div>
  );
}

/**
 * Past Stelli shoots, with the review left for each. Only shoots both the
 * client and the creator agreed to share. With none, nothing renders at all.
 */
export default function PastShoots({ lensmanId, firstName }) {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [viewer, setViewer] = useState(null); // { photos, index, fromEl }

  const closeViewer = useCallback(() => setViewer(null), []);
  const stepViewer = useCallback(
    (d) => setViewer((v) => (v ? { ...v, fromEl: null, index: (v.index + d + v.photos.length) % v.photos.length } : v)),
    []
  );
  const openPhoto = useCallback(
    (photos, index, fromEl) => setViewer({ photos: photos.map((src) => ({ src })), index, fromEl }),
    []
  );

  const { data: shoots = [] } = useQuery({
    queryKey: ['past-shoots', lensmanId],
    enabled: !!lensmanId,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await base44.functions.invoke('getPastShoots', { lensmanId });
      return res.data?.shoots || [];
    },
  });

  // Cards rise in, one after another, the first time the section scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || inView) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shoots.length, inView]);

  const open = shoots.find((s) => s.id === openId);
  useEffect(() => {
    if (!open || viewer) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpenId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, viewer]);

  if (!shoots.length) return null;

  const reviewed = shoots.filter((s) => s.review?.rating);
  const avg = reviewed.length ? reviewed.reduce((sum, s) => sum + s.review.rating, 0) / reviewed.length : 0;

  return (
    <section ref={sectionRef} className={`ps ${inView ? 'in' : ''}`} aria-labelledby="ps-title">
      <header className="ps-head">
        <div>
          <p className="ps-eyebrow">
            <ShieldCheck strokeWidth={2.2} /> Real bookings, shared with permission
          </p>
          <h2 id="ps-title">
            Past Stelli shoots
            <small>
              {shoots.length} {shoots.length === 1 ? 'shoot' : 'shoots'}
            </small>
          </h2>
        </div>
        {reviewed.length > 0 && (
          <div className="ps-score" aria-label={`Rated ${avg.toFixed(1)} out of 5 from ${reviewed.length} reviews`}>
            <b>{avg.toFixed(1)}</b>
            <span>
              <Stars rating={avg} />
              <small>
                {reviewed.length} {reviewed.length === 1 ? 'review' : 'reviews'}
              </small>
            </span>
          </div>
        )}
      </header>

      <div className={`ps-grid ${shoots.length === 1 ? 'solo' : ''}`}>
        {shoots.map((s, i) => (
          <ShootCard key={s.id} shoot={s} index={i} onOpen={(id) => setOpenId(id)} />
        ))}
      </div>

      <p className="ps-consent">
        <ShieldCheck strokeWidth={2} />
        Every shoot here was booked through Stelli and shared with permission from both the client and {firstName}. Either of
        them can take it down at any time.
      </p>

      {open && <ShootSheet shoot={open} firstName={firstName} onClose={() => setOpenId(null)} onPhoto={openPhoto} />}

      {viewer && (
        <PhotoViewer photos={viewer.photos} index={viewer.index} fromEl={viewer.fromEl} onClose={closeViewer} onStep={stepViewer} />
      )}
    </section>
  );
}
