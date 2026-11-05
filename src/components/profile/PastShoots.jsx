import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ShieldCheck, Star, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function Stars({ rating = 0 }) {
  const r = Math.round(rating);
  return (
    <span className="cp-stars" aria-label={`${r} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={n <= r ? '' : 'off'} strokeWidth={0} />
      ))}
    </span>
  );
}

function monthLabel(date) {
  if (!date) return '';
  const d = new Date(`${String(date).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const titleFor = (shoot) => (shoot.event_type ? shoot.event_type.replace(/_/g, ' ') : 'Stelli shoot');

/**
 * Past Stelli shoots, with the review left for each. Only shoots both the
 * client and the creator agreed to share. With none, nothing renders at all.
 */
export default function PastShoots({ lensmanId, firstName, onOpenPhotos }) {
  const [openId, setOpenId] = useState(null);
  const { data: shoots = [] } = useQuery({
    queryKey: ['past-shoots', lensmanId],
    enabled: !!lensmanId,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await base44.functions.invoke('getPastShoots', { lensmanId });
      return res.data?.shoots || [];
    },
  });

  const open = shoots.find((s) => s.id === openId);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpenId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!shoots.length) return null;

  const reviewed = shoots.filter((s) => s.review?.rating);
  const avg = reviewed.length ? reviewed.reduce((sum, s) => sum + s.review.rating, 0) / reviewed.length : 0;

  return (
    <section aria-labelledby="cp-shoots-title">
      <div className="cp-shoots-head">
        <h2 id="cp-shoots-title">
          Past Stelli shoots<small>{shoots.length} {shoots.length === 1 ? 'shoot' : 'shoots'}</small>
        </h2>
        {reviewed.length > 0 && (
          <span className="cp-score">
            <Stars rating={avg} />
            <b>{avg.toFixed(1)}</b>from {reviewed.length} {reviewed.length === 1 ? 'review' : 'reviews'}
          </span>
        )}
      </div>

      <div className="cp-shoots">
        {shoots.map((s) => {
          const [a, ...more] = s.photos;
          return (
            <button key={s.id} type="button" className="cp-shoot" onClick={() => setOpenId(s.id)} aria-label={`Open the ${titleFor(s)} shoot`}>
              <div className={`cp-pics ${more.length ? '' : 'one'}`}>
                <img src={a} alt="" loading="lazy" />
                {more.length > 0 && (
                  <div>
                    {more.slice(0, 2).map((src) => (
                      <img key={src} src={src} alt="" loading="lazy" />
                    ))}
                  </div>
                )}
              </div>
              <div className="cp-body">
                <div className="cp-top">
                  <b>{titleFor(s)}</b>
                  <span>{monthLabel(s.event_date)}</span>
                </div>
                {s.review?.rating > 0 && <Stars rating={s.review.rating} />}
                {s.review?.comment && <q>{s.review.comment}</q>}
                <div className="cp-who2">
                  <span>{s.client_first_name}</span>
                  <span className="cp-ok">
                    <Check strokeWidth={2.6} />
                    Shared with permission
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="cp-consent">
        <ShieldCheck strokeWidth={2} />
        Every shoot here was shared with permission from both the client and {firstName}. Either of them can take it down at any time.
      </p>

      {open && (
        <div className="cp-sheet" role="dialog" aria-modal="true" aria-labelledby="cp-sheet-title" onClick={(e) => e.target === e.currentTarget && setOpenId(null)}>
          <div className="cp-sheet-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="cp-sheet-title">{titleFor(open)}</h3>
                <p className="cp-meta">
                  {[monthLabel(open.event_date), 'Booked through Stelli', `Shared with permission from ${firstName} and ${open.client_first_name}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button type="button" className="cp-close" aria-label="Close shoot" onClick={() => setOpenId(null)} autoFocus>
                <X strokeWidth={2.4} />
              </button>
            </div>
            <div className="mt-[18px] grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {open.photos.map((src, i) => (
                <button key={src} type="button" className="overflow-hidden rounded-[10px]" style={{ aspectRatio: '4 / 5', cursor: 'zoom-in' }} onClick={() => onOpenPhotos?.(open.photos, i)} aria-label={`Open photo ${i + 1}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            {open.review && (
              <div className="cp-rev">
                <Stars rating={open.review.rating} />
                {open.review.comment && <q>{open.review.comment}</q>}
                <p>{open.client_first_name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
