import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Lock, Share, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PrintWall from '@/components/profile/PrintWall';
import PastShoots from '@/components/profile/PastShoots';
import { accentColor, displayNameOf, displaySettings, galleryComposition, printLabel, shareUrl } from '@/lib/profilePresets';
import './creatorProfile.css';

function hasBookingDraft(creatorId, viewerKey) {
  try {
    const draft = JSON.parse(localStorage.getItem(`stelli_booking_draft_${creatorId}_${viewerKey}`) || '{}');
    return Object.values(draft.form || {}).some(Boolean);
  } catch {
    return false;
  }
}

function ShareButton({ creator }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = shareUrl(creator);
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
      onClick={copy}
      style={copied ? { background: 'hsl(var(--neon-lime) / .22)' } : undefined}
    >
      {copied ? <Check strokeWidth={2.4} /> : <Share strokeWidth={2} />}
    </button>
  );
}

/**
 * The public creator profile, exactly as a client sees it: who they are, their
 * work hung the way THEY chose in their editor, past shoots both sides agreed
 * to share, and how booking works. Shared by the public route and the admin
 * application review, which drops its private panel in via `adminPanel`.
 */
export default function CreatorProfileView({ creatorId, adminPanel = null }) {
  const ctaRef = useRef(null);
  const [barOn, setBarOn] = useState(false);
  const [seeAll, setSeeAll] = useState(false);

  const { data: creator, isLoading } = useQuery({
    queryKey: ['creator', creatorId],
    enabled: !!creatorId,
    queryFn: async () => {
      // The route carries either the profile link name or the record ID.
      if (/^[a-f0-9]{24}$/i.test(creatorId)) {
        const byId = await base44.entities.Lensman.filter({ id: creatorId }).catch(() => []);
        if (byId[0]) return byId[0];
      }
      const bySlug = await base44.entities.Lensman.filter({ slug: creatorId }).catch(() => []);
      return bySlug[0];
    },
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

  // The floating booking bar shows once the main button scrolls away.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => setBarOn(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [creator?.id]);

  const name = displayNameOf(creator);
  const photos = useMemo(() => galleryComposition(creator).all.map((src) => ({ src })), [creator]);
  const settings = useMemo(() => displaySettings(creator), [creator]);
  const label = useMemo(() => printLabel(name), [name]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink px-5 md:px-10 pt-24 pb-24 max-w-[1180px] mx-auto">
        <Skeleton className="h-[84px] w-[60%] rounded-full" />
        <Skeleton className="h-[520px] w-full mt-10 rounded-3xl" />
      </div>
    );
  }

  if (!creator) {
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

  const accent = accentColor(creator.accent_color);
  const firstName = String(name).trim().split(' ')[0];
  const hasDraft = hasBookingDraft(creator.id, viewer?.id || 'guest');
  const bookingLabel = hasDraft ? 'Return to your request' : creator.booking_cta || 'Request a date';
  const specialties = (creator.specialties || []).filter(Boolean);
  const tags = (creator.style_tags || []).slice(0, 3);
  const spots = (creator.neighborhoods || []).filter(Boolean);
  const shoots = Number(creator.completed_shoots) || 0;
  const reviews = Number(creator.review_count) || 0;
  const rating = Number(creator.avg_rating) || 0;
  const isNew = shoots === 0 && reviews === 0;
  const useGrid = settings.layout === 'grid';

  return (
    <div className="cp min-h-screen bg-ink pb-28" style={{ '--cp-accent': accent }}>
      {adminPanel}

      <div className="cp-wrap">
        <Link to="/creators" className="cp-back">
          <ChevronLeft className="h-[15px] w-[15px]" strokeWidth={2.2} />
          All creators
        </Link>

        <section className="cp-who" aria-label={`About ${name}`}>
          {creator.profile_image ? (
            <img className="cp-avatar" src={creator.profile_image} alt={name} />
          ) : (
            <div className="cp-avatar" aria-hidden>{(name[0] || '?').toUpperCase()}</div>
          )}
          <div className="min-w-0">
            <p className="cp-eyebrow">{creator.market === 'ELON' || !creator.market ? 'Elon' : creator.market} · Photographer</p>
            <h1>{name}</h1>
            <div className="cp-facts">
              {isNew && <span className="cp-new">New to Stelli</span>}
              {reviews > 0 && rating > 0 && (
                <span className="cp-rating">
                  <Star strokeWidth={0} />
                  <b className="text-white">{rating.toFixed(1)}</b> · {reviews} {reviews === 1 ? 'review' : 'reviews'}
                </span>
              )}
              {shoots > 0 && <span>{shoots} Stelli {shoots === 1 ? 'shoot' : 'shoots'}</span>}
              {specialties.length > 0 && <span>{specialties.join(' · ')}</span>}
            </div>
            {creator.one_liner && <p className="cp-line">{creator.one_liner}</p>}
          </div>
          <div>
            <div className="cp-actions">
              <Link ref={ctaRef} to={`/book/${creator.id}`} className="cp-btn cp-btn-lime">
                {bookingLabel}
              </Link>
              <ShareButton creator={creator} />
            </div>
            {hasDraft && <p className="cp-draft">Your in-progress request is saved.</p>}
          </div>
        </section>

        <div className="cp-workbar">
          <h2>
            Work<small>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</small>
          </h2>
          {!useGrid && photos.length > 1 && (
            <div className="cp-seg" role="group" aria-label="How to show the work">
              <button type="button" aria-pressed={!seeAll} onClick={() => setSeeAll(false)}>
                {settings.layout === 'strip' ? 'Strip' : 'Wall'}
              </button>
              <button type="button" aria-pressed={seeAll} onClick={() => setSeeAll(true)}>
                See all
              </button>
            </div>
          )}
        </div>
      </div>

      {photos.length ? (
        <div className={useGrid || seeAll ? 'cp-wrap' : 'cp-wallgap'}>
          <PrintWall photos={photos} settings={settings} label={label} accent={accent} name={`${name}'s`} showAll={seeAll} />
        </div>
      ) : (
        <div className="cp-wrap">
          <div className="cp-nowork">{firstName} hasn't added work yet.</div>
        </div>
      )}

      <div className="cp-wrap">
        <PastShoots lensmanId={creator.id} firstName={firstName} />

        <div className="cp-details" id="book">
          {(creator.bio || tags.length > 0 || (creator.prompt_question && creator.prompt_answer) || creator.dont_shoot || creator.equipment) && (
            <div className="cp-box">
              {creator.bio && (
                <>
                  <h3>About {firstName}</h3>
                  <p className="cp-bio">{creator.bio}</p>
                </>
              )}
              {creator.prompt_question && creator.prompt_answer && (
                <>
                  <h3>{creator.prompt_question}</h3>
                  <p className="cp-prompt">
                    <q>{creator.prompt_answer}</q>
                  </p>
                </>
              )}
              {tags.length > 0 && (
                <>
                  <h3>Style</h3>
                  <div className="cp-chips">
                    {tags.map((t) => (
                      <span key={t} className="cp-chip">{t}</span>
                    ))}
                  </div>
                </>
              )}
              {creator.equipment && (
                <>
                  <h3>In the bag</h3>
                  <p className="cp-bio">{creator.equipment}</p>
                </>
              )}
              {creator.dont_shoot && (
                <>
                  <h3>Doesn't shoot</h3>
                  <p className="cp-bio">{creator.dont_shoot}</p>
                </>
              )}
            </div>
          )}

          <div className="cp-box">
            <h3>How booking {firstName} works</h3>
            <ol className="cp-steps">
              <li>
                <span>1</span>
                <p><b>Send your date and idea.</b> No prices posted, no obligation.</p>
              </li>
              <li>
                <span>2</span>
                <p><b>{firstName} sends a private quote</b> in your messages.</p>
              </li>
              <li>
                <span>3</span>
                <p><b>Accept and pay.</b> Your payment is held until your photos are delivered.</p>
              </li>
            </ol>
            <div className="cp-lock">
              <Lock strokeWidth={2} />
              {firstName}&apos;s phone and email unlock once your booking is confirmed.
            </div>
          </div>

          {spots.length > 0 && (
            <div className="cp-box">
              <h3>Where {firstName} shoots</h3>
              <div className="cp-chips">
                {spots.map((s) => (
                  <span key={s} className="cp-chip">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`cp-bar ${barOn ? 'show' : ''}`} aria-hidden={!barOn}>
        {creator.profile_image ? <img src={creator.profile_image} alt="" /> : <span className="cp-mini" />}
        <div className="cp-t">
          <b>{name}</b>
          <small>Elon · Photographer</small>
        </div>
        <Link to={`/book/${creator.id}`} className="cp-btn cp-btn-lime" tabIndex={barOn ? 0 : -1}>
          {hasDraft ? 'Return' : 'Request a date'}
        </Link>
      </div>
    </div>
  );
}
