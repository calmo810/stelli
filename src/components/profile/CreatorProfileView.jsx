import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, Share } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CreatorProfile from '@/components/profile/CreatorProfile';
import useCurrentUser from '@/hooks/useCurrentUser';
import { MARKET_LABEL, displayNameOf, profileUrl, sharePreviewUrl } from '@/lib/creatorProfile';

function hasBookingDraft(creatorId, viewerKey) {
  try {
    const draft = JSON.parse(localStorage.getItem(`stelli_booking_draft_${creatorId}_${viewerKey}`) || '{}');
    return Object.values(draft.form || {}).some(Boolean);
  } catch {
    return false;
  }
}

/**
 * Share: the phone's own share sheet where there is one (with the link that
 * carries a preview card), otherwise the plain profile link is copied.
 */
function ShareButton({ creator }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const title = `Book ${displayNameOf(creator)} on Stelli`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: sharePreviewUrl(creator) });
        return;
      } catch (error) {
        // Closing the share sheet is not a failure, and nothing should be copied.
        if (error?.name === 'AbortError') return;
      }
    }
    const url = profileUrl(creator);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this profile link', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <button
      type="button"
      className="cp-btn cp-btn-ghost"
      aria-label={copied ? 'Link copied' : 'Share profile'}
      onClick={share}
      style={copied ? { background: 'hsl(var(--neon-lime) / .22)' } : undefined}
    >
      {copied ? <Check strokeWidth={2.4} aria-hidden /> : <Share strokeWidth={2} aria-hidden />}
    </button>
  );
}

/**
 * The public creator profile route: finds the creator, counts the visit, and
 * hands the record to CreatorProfile, which draws it.
 */
export default function CreatorProfileView({ creatorId }) {
  const ctaRef = useRef(null);
  const [barOn, setBarOn] = useState(false);
  const { user: viewer } = useCurrentUser();

  const { data: creator, isLoading, isError, refetch } = useQuery({
    queryKey: ['creator', creatorId],
    enabled: !!creatorId,
    queryFn: async () => {
      // The route carries either the profile link name or the record ID.
      if (/^[a-f0-9]{24}$/i.test(creatorId)) {
        const byId = await base44.entities.Lensman.filter({ id: creatorId });
        if (byId[0]) return byId[0];
      }
      const bySlug = await base44.entities.Lensman.filter({ slug: creatorId });
      return bySlug[0] || null;
    },
  });

  // One look per visit, counted for the creator's own dashboard.
  useEffect(() => {
    if (!creator?.id || creator.status !== 'approved') return;
    try {
      const key = `stelli_view_${creator.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      return;
    }
    base44.functions.invoke('trackProfileView', { lensmanId: creator.id }).catch(() => {});
  }, [creator?.id, creator?.status]);

  // The floating booking bar shows once the main button scrolls away.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => setBarOn(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [creator?.id]);

  // The tab says whose page this is.
  useEffect(() => {
    if (!creator?.display_name) return undefined;
    const previous = document.title;
    document.title = `${displayNameOf(creator)} · Stelli`;
    return () => {
      document.title = previous;
    };
  }, [creator]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink px-5 md:px-10 pt-24 pb-24 max-w-[1180px] mx-auto" aria-busy="true" aria-label="Loading profile">
        <Skeleton className="h-[84px] w-[60%] rounded-full" />
        <Skeleton className="h-[520px] w-full mt-10 rounded-3xl" />
      </div>
    );
  }

  // A page that failed to load is not a page that doesn't exist.
  if (isError) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-4xl text-white mb-3">This page didn't load.</p>
          <button type="button" onClick={() => refetch()} className="text-[13px] font-semibold text-neon-lime">
            Try again
          </button>
        </div>
      </div>
    );
  }

  // On hold: the page is not shown while a founder looks, except to the
  // creator themselves and to founders. Booking is refused on the server too.
  const onHold = creator?.under_review && viewer?.id !== creator.user_id && viewer?.role !== 'admin';

  if (!creator || onHold) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-4xl text-white mb-3">Creator not found.</p>
          <Link to="/creators" className="text-[13px] font-semibold text-neon-lime">
            Back to all creators
          </Link>
        </div>
      </div>
    );
  }

  const name = displayNameOf(creator);
  const mine = viewer?.id && viewer.id === creator.user_id;
  const live = creator.status === 'approved';
  const hasDraft = hasBookingDraft(creator.id, viewer?.id || 'guest');

  return (
    <div className="min-h-screen bg-ink pb-28">
      {/* The creator looking at their own page sees where it stands and the way to change it. */}
      {mine && (
        <div className="cp-own">
          <p>
            {live
              ? 'This is your live page, exactly as clients see it.'
              : 'Only you can see this page until Stelli approves it.'}
          </p>
          <Link to="/edit-profile">Edit profile</Link>
        </div>
      )}

      <CreatorProfile
        creator={creator}
        ctaRef={ctaRef}
        bookingLabel={hasDraft ? 'Return to your request' : ''}
        bookingNote={hasDraft ? 'Your in-progress request is saved.' : ''}
        actions={<ShareButton creator={creator} />}
      />

      <div className={`cp cp-bar ${barOn ? 'show' : ''}`} aria-hidden={!barOn}>
        {creator.profile_image ? <img src={creator.profile_image} alt="" /> : <span className="cp-mini" />}
        <div className="cp-t">
          <b>{name}</b>
          <small>{MARKET_LABEL} · Photographer</small>
        </div>
        <Link to={`/book/${creator.id}`} className="cp-btn cp-btn-lime" tabIndex={barOn ? 0 : -1}>
          {hasDraft ? 'Return' : 'Request a date'}
        </Link>
      </div>
    </div>
  );
}
