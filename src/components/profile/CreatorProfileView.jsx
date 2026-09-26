import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileCover from '@/components/profile/ProfileCover';
import BackButton from '@/components/shared/BackButton';
import StyleTagChips from '@/components/profile/StyleTagChips';
import PromptBlock from '@/components/profile/PromptBlock';
import DoesntShoot from '@/components/profile/DoesntShoot';
import ProfileGallery from '@/components/profile/ProfileGallery';
import ProfileBookingBar from '@/components/profile/ProfileBookingBar';
import ShareProfileButton from '@/components/profile/ShareProfileButton';
import ReviewsList from '@/components/profile/ReviewsList';
import RatingDisplay from '@/components/RatingDisplay';
import { accentColor, coverImage, focalPoint, galleryComposition, displayNameOf } from '@/lib/profilePresets';

const COVER_RATIO = {
  night_flash: 'aspect-[4/5] sm:aspect-[3/2]',
  clean_portfolio: 'aspect-[4/5] sm:aspect-[2/1]',
};

function hasBookingDraft(creatorId, viewerKey) {
  try {
    const draft = JSON.parse(localStorage.getItem(`stelli_booking_draft_${creatorId}_${viewerKey}`) || '{}');
    return Object.values(draft.form || {}).some(Boolean);
  } catch {
    return false;
  }
}

/**
 * The public creator profile, exactly as a client sees it. Shared by the public
 * route and the admin application review, which drops its private panel in via
 * `adminPanel`.
 */
export default function CreatorProfileView({ creatorId, adminPanel = null }) {
  const { data: creator, isLoading } = useQuery({
    queryKey: ['creator', creatorId],
    enabled: !!creatorId,
    queryFn: async () => {
      // The route carries either the profile link name or the record ID, so
      // old links keep working alongside the generated ones.
      if (/^[a-f0-9]{24}$/i.test(creatorId)) {
        const byId = await base44.entities.Lensman.filter({ id: creatorId }).catch(() => []);
        if (byId[0]) return byId[0];
      }
      const bySlug = await base44.entities.Lensman.filter({ slug: creatorId }).catch(() => []);
      return bySlug[0];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['creator-reviews', creatorId],
    enabled: !!creatorId,
    queryFn: () => base44.entities.Review.filter({ lensman_id: creatorId }, '-created_date'),
  });

  const { data: viewer } = useQuery({
    queryKey: ['draft-viewer'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink px-5 md:px-10 pt-32 pb-24 max-w-[1500px] mx-auto">
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

  const accent = accentColor(creator.accent_color);
  const cover = coverImage(creator);
  const focal = focalPoint(creator);
  const { pinned, rest } = galleryComposition(creator);
  const tags = (creator.style_tags || []).slice(0, 3);
  const name = displayNameOf(creator);
  const firstName = String(name).trim().split(' ')[0];
  const hasDraft = hasBookingDraft(creator.id, viewer?.id || 'guest');
  const bookingLabel = creator.booking_cta || 'Request a date';

  return (
    <div className="min-h-screen bg-ink pb-32 lg:pb-24">
      {adminPanel}

      <div className="max-w-[1500px] mx-auto px-5 md:px-10 pt-4 md:pt-6 mb-6">
        <Link to="/creators" className="inline-flex items-center gap-2 label-mono text-[10px] text-white/35 hover:text-neon-lime transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> All creators
        </Link>
      </div>

      <ProfileCover src={cover} focal={focal} ratioClass={COVER_RATIO[creator.profile_theme] || COVER_RATIO.night_flash}>
        <div className="absolute left-5 top-5 md:left-10 md:top-7">
          <BackButton variant="hero" />
        </div>
      </ProfileCover>

      <div className="max-w-[1500px] mx-auto px-5 md:px-10 pt-10">
        <div className="grid lg:grid-cols-[1fr_340px] gap-12 lg:gap-16 items-start">
          <div className="space-y-12 min-w-0">
            <header>
              <p className="label-mono text-[9px] mb-4" style={{ color: accent }}>
                {creator.market || 'ELON'} · {creator.specialties?.join(' / ') || 'Photography'}
              </p>
              <h1
                className="font-heading font-semibold text-white leading-[0.95]"
                style={{ fontSize: 'clamp(38px, 6vw, 78px)' }}
              >
                {name}
              </h1>
              <p className="font-heading font-normal text-white/60 mt-3" style={{ fontSize: 'clamp(15px, 1.6vw, 21px)' }}>
                {creator.one_liner || tags.join(' · ')}
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6">
                <span className="flex items-center gap-1.5">
                  <RatingDisplay rating={creator.avg_rating} reviewCount={creator.review_count} color={accent} />
                  {creator.review_count > 0 && (
                    <span className="font-body text-[12px] text-white/35">({creator.review_count} reviews)</span>
                  )}
                </span>
                <span className="label-mono text-[9px] text-white/40">{creator.completed_shoots || 0} shoots completed</span>
                <span className="label-mono text-[9px] text-white/40">
                  {creator.neighborhoods?.[0] || creator.market || 'ELON'}
                </span>
              </div>

              <StyleTagChips tags={tags} accent={accent} className="mt-6" />

              <DoesntShoot line={creator.dont_shoot} />

              {creator.bio && (
                <p className="font-body text-[14px] leading-[1.9] text-white/50 max-w-2xl mt-7">{creator.bio}</p>
              )}
            </header>

            <ProfileGallery pinned={pinned} galleryStyle={creator.gallery_style} accent={accent} />

            <PromptBlock question={creator.prompt_question} answer={creator.prompt_answer} accent={accent} />

            <ProfileGallery rest={rest} galleryStyle={creator.gallery_style} />

            <section>
              <p className="label-mono text-[9px] text-white/30 mb-6">Reviews</p>
              <ReviewsList reviews={reviews} />
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit space-y-3">
            <div className="border p-7" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.12)', borderRadius: 4 }}>
              <p className="label-mono text-[9px] text-white/35 mb-6">Request a shoot</p>
              <p className="font-body text-[13px] leading-relaxed text-white/50 mb-7">
                Send your date, location and brief. {firstName} replies with a private quote — no price tags, no obligation.
              </p>
              <Link
                to={`/book/${creator.id}`}
                className="block w-full text-center label-mono text-[11px] font-semibold px-6 py-4 transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
              >
                {hasDraft ? 'Return to booking request' : bookingLabel}
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
            </div>

            <ShareProfileButton creator={creator} className="w-full" />
          </aside>
        </div>
      </div>

      <ProfileBookingBar creatorId={creator.id} label={bookingLabel} />
    </div>
  );
}