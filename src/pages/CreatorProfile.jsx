import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Star, Lock, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function hasBookingDraft(creatorId) {
  try {
    const draft = JSON.parse(localStorage.getItem(`stelli_booking_draft_${creatorId}`) || '{}');
    return Object.values(draft.form || {}).some(Boolean);
  } catch {
    return false;
  }
}

export default function CreatorProfile() {
  const { id } = useParams();

  const { data: creator, isLoading } = useQuery({
    queryKey: ['creator', id],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id });
      return list[0];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink px-5 md:px-10 pt-32 pb-24 max-w-[1500px] mx-auto">
        <Skeleton className="h-12 w-72 mb-8" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-heading text-4xl text-white mb-3">Creator not found.</p>
          <Link to="/creators" className="label-mono text-[10px] text-neon-lime neon-underline">Back to browse</Link>
        </div>
      </div>
    );
  }

  const images = creator.portfolio_images || [];
  const city = creator.neighborhoods?.[0] || creator.market || 'NYC';
  const hasDraft = hasBookingDraft(creator.id);

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10 pt-28 pb-24">
        <Link to="/creators" className="inline-flex items-center gap-2 label-mono text-[10px] text-white/35 hover:text-neon-lime transition-colors mb-12">
          <ArrowLeft className="w-3.5 h-3.5" /> All creators
        </Link>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-start">
          <div>
            <p className="label-mono text-[9px] mb-4" style={{ color: 'hsl(var(--neon-cyan))' }}>
              {creator.market || 'NYC'} · {creator.specialties?.join(' / ') || 'Photography'}
            </p>
            <h1 className="font-heading font-semibold text-white leading-[0.92] mb-6" style={{ fontSize: 'clamp(38px, 6.5vw, 84px)' }}>
              {creator.full_name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4" style={{ color: 'hsl(var(--neon-magenta))' }} fill="hsl(var(--neon-magenta))" />
                <span className="font-body text-[13px] text-white/75">{(creator.avg_rating || 0).toFixed(1)}</span>
                <span className="font-body text-[12px] text-white/35">({creator.review_count || 0} reviews)</span>
              </span>
              <span className="label-mono text-[9px] text-white/40">{creator.completed_shoots || 0} shoots completed</span>
              <span className="label-mono text-[9px] text-white/40">{city}</span>
            </div>

            <p className="font-body text-[14px] md:text-[15px] leading-[1.9] text-white/55 max-w-2xl">
              {creator.bio || 'This creator has not written a bio yet.'}
            </p>

            {creator.featured_quote && (
              <p className="font-hand text-[24px] mt-8" style={{ color: 'hsl(var(--neon-lime))' }}>
                {creator.featured_quote}
              </p>
            )}
          </div>

          <aside className="border border-white/12 p-7 md:p-8" style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}>
            <p className="label-mono text-[9px] text-white/35 mb-6">Request a shoot</p>
            <p className="font-body text-[13px] leading-relaxed text-white/50 mb-7">
              Send your date, location and brief. {creator.full_name.split(' ')[0]} replies with a private quote — no price tags, no obligation.
            </p>
            <Link
              to={`/book/${creator.id}`}
              className="block w-full text-center label-mono text-[11px] font-semibold px-6 py-4 transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
            >
              {hasDraft ? 'Return to booking request' : 'Request this creator'}
            </Link>
            {hasDraft && (
              <p className="font-body text-[11px] leading-relaxed text-white/35 mt-3 text-center">
                Your in-progress request is saved.
              </p>
            )}

            <div className="mt-7 pt-6 border-t border-white/10 flex items-start gap-3">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-white/30" />
              <p className="font-body text-[11px] leading-relaxed text-white/35">
                Contact details unlock for you once your booking is confirmed.
              </p>
            </div>
          </aside>
        </div>

        {images.length > 0 && (
          <section className="mt-20">
            <p className="label-mono text-[9px] text-white/35 mb-7">Portfolio</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((src, i) => (
                <div key={i} className="overflow-hidden" style={{ borderRadius: 4 }}>
                  <img src={src} alt="" className="w-full h-[380px] object-cover transition-transform duration-700 hover:scale-[1.03]" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}