import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { coverImage, displayNameOf } from '@/lib/profilePresets';

const CARD_WIDTH = 'clamp(260px, 28vw, 420px)';
const CARD_RADIUS = 24;
const CARD_BG = 'hsl(var(--surface))';

const HIGHLIGHT = {
  background: 'hsl(var(--neon-lime))',
  color: 'hsl(var(--ink))',
  padding: '.02em .22em .06em',
  borderRadius: 6,
  WebkitBoxDecorationBreak: 'clone',
  boxDecorationBreak: 'clone',
};

/**
 * The home page rail: approved creators as Apple-style swipe cards, with a
 * lime "your name could be here" card on the end for creators.
 */
export default function MeetCreators() {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['meet-the-creators'],
    queryFn: () => base44.entities.Lensman.filter({ status: 'approved' }),
  });

  const shown = [...creators]
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) || (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 8);

  const sync = () => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [isLoading, shown.length]);

  const scroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = (card?.offsetWidth || 320) + 16;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section className="py-[44px] md:py-[60px] border-t border-white/10">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 flex items-end justify-between gap-5">
        <h2
          className="font-display font-medium text-white leading-[1.08] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(30px, 4.6vw, 64px)' }}
        >
          Meet the{' '}
          <span className="inline-block" style={{ transform: 'rotate(-1.5deg)', marginTop: '.14em' }}>
            <span style={HIGHLIGHT}>creators.</span>
          </span>
        </h2>
        <Link
          to="/creators"
          className="shrink-0 font-body text-[15px] font-medium whitespace-nowrap transition-colors hover:underline"
          style={{ color: 'hsl(var(--neon-lime))', textUnderlineOffset: 4 }}
        >
          See all ›
        </Link>
      </div>

      {isLoading ? (
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 mt-9 flex gap-4" aria-label="Loading creators">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton
              key={i}
              className="shrink-0 aspect-[4/5]"
              style={{ width: CARD_WIDTH, borderRadius: CARD_RADIUS }}
            />
          ))}
        </div>
      ) : (
        <div
          ref={trackRef}
          onScroll={sync}
          className="max-w-[1440px] mx-auto px-5 md:px-10 mt-9 flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth pt-2 pb-6"
        >
          {shown.map((creator) => {
            const image = coverImage(creator);
            return (
              <Link
                key={creator.id}
                data-card
                to={`/creators/${creator.slug || creator.id}`}
                className="group shrink-0 snap-start relative overflow-hidden aspect-[4/5] transition-transform duration-500 hover:scale-[1.02]"
                style={{ width: CARD_WIDTH, borderRadius: CARD_RADIUS, background: CARD_BG }}
              >
                {image && (
                  <img
                    src={image}
                    alt={displayNameOf(creator)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, hsl(var(--ink) / 0.9) 0%, transparent 50%)' }}
                />
                <div className="absolute left-[22px] right-[22px] bottom-[22px] z-10">
                  <p className="font-display font-medium text-white leading-none" style={{ fontSize: 30 }}>
                    {displayNameOf(creator)}
                  </p>
                  <p className="mt-2 font-body text-[14px] text-white/70">
                    Elon · {creator.specialties?.[0] || 'Photography'}
                  </p>
                </div>
              </Link>
            );
          })}

          <Link
            data-card
            to="/register?role=creator"
            className="shrink-0 snap-start relative flex flex-col justify-between aspect-[4/5] transition-transform duration-500 hover:scale-[1.02]"
            style={{
              width: CARD_WIDTH,
              borderRadius: CARD_RADIUS,
              background: 'hsl(var(--neon-lime))',
              color: 'hsl(var(--ink))',
              padding: 26,
            }}
          >
            <p className="font-display font-medium leading-[1.05]" style={{ fontSize: 34 }}>
              Your name
              <br />
              could be here.
            </p>
            <p className="font-body text-[15px]" style={{ color: 'hsl(var(--ink) / 0.7)' }}>
              Take photos? Apply to join ›
            </p>
          </Link>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-5 md:px-10 hidden sm:flex justify-end gap-2.5">
        <button
          type="button"
          onClick={() => scroll(-1)}
          disabled={edges.start}
          aria-label="Previous creators"
          className="w-11 h-11 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          disabled={edges.end}
          aria-label="Next creators"
          className="w-11 h-11 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-[18px] h-[18px]" />
        </button>
      </div>
    </section>
  );
}