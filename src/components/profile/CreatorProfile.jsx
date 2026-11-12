import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Lock, Star } from 'lucide-react';
import PrintWall from '@/components/profile/PrintWall';
import PastShoots from '@/components/profile/PastShoots';
import { PH } from '@/lib/wizardData';
import { MARKET_LABEL, accentColor, displaySettings, galleryComposition, printLabel } from '@/lib/creatorProfile';
import './creatorProfile.css';

/**
 * A creator's page, drawn from a profile record.
 *
 * This is the one drawing of a profile. The public route gives it the saved
 * record; the wizard gives it the form the creator is filling in, as a record
 * of the same shape, with `preview` on. So the live preview a creator builds
 * against is the page a client later opens, section for section.
 *
 * `preview` turns the page into a picture of itself: nothing navigates,
 * nothing is counted, and blanks show a gentle placeholder instead of
 * vanishing. `compact` is the phone-sized preview.
 */
export default function CreatorProfile({
  creator,
  preview = false,
  compact = false,
  bookingLabel = '',
  bookingNote = '',
  ctaRef = null,
  actions = null,
}) {
  const [seeAll, setSeeAll] = useState(false);

  const name = String(creator?.display_name || '').trim() || (preview ? 'Your name' : 'Stelli creator');
  const firstName = name.split(' ')[0];
  const real = useMemo(() => galleryComposition(creator).all.map((src) => ({ src })), [creator]);
  // Soft empty frames stand in for the work until the first photos land.
  const photos = useMemo(
    () => (real.length || !preview ? real : Array.from({ length: 6 }, (_, i) => ({ bg: PH[i % PH.length] }))),
    [real, preview]
  );
  const settings = useMemo(() => displaySettings(creator), [creator]);
  const label = useMemo(() => printLabel(name), [name]);

  const accent = accentColor(creator?.accent_color);
  const specialties = (creator?.specialties || []).filter(Boolean);
  const tags = (creator?.style_tags || []).slice(0, 3);
  const spots = (creator?.neighborhoods || []).filter(Boolean);
  const shoots = Number(creator?.completed_shoots) || 0;
  const reviews = Number(creator?.review_count) || 0;
  const rating = Number(creator?.avg_rating) || 0;
  const isNew = shoots === 0 && reviews === 0;
  const useGrid = settings.layout === 'grid';
  const years = Number(creator?.years_experience) || 0;
  const hasPrompt = Boolean(creator?.prompt_question && creator?.prompt_answer);
  const hasAbout = Boolean(creator?.bio || tags.length || hasPrompt || creator?.dont_shoot || creator?.equipment || years);
  const cta = bookingLabel || creator?.booking_cta || 'Request a date';

  return (
    <div className={`cp ${compact ? 'cp-compact' : ''} ${preview ? 'cp-preview' : ''}`} style={/** @type {React.CSSProperties} */ ({ '--cp-accent': accent })}>
      <div className="cp-wrap">
        {!preview && (
          <Link to="/creators" className="cp-back">
            <ChevronLeft className="h-[15px] w-[15px]" strokeWidth={2.2} />
            All creators
          </Link>
        )}

        <section className="cp-who" aria-label={`About ${name}`}>
          {creator?.profile_image ? (
            <img className="cp-avatar" src={creator.profile_image} alt={preview ? '' : name} />
          ) : (
            <div className="cp-avatar" aria-hidden>{(name[0] || '?').toUpperCase()}</div>
          )}
          <div className="min-w-0">
            <p className="cp-eyebrow">{MARKET_LABEL} · Photographer</p>
            {preview ? <p className="cp-name">{name}</p> : <h1 className="cp-name">{name}</h1>}
            <div className="cp-facts">
              {isNew && <span className="cp-new">New to Stelli</span>}
              {reviews > 0 && rating > 0 && (
                <span className="cp-rating">
                  <Star strokeWidth={0} aria-hidden />
                  <b>{rating.toFixed(1)}</b> · {reviews} {reviews === 1 ? 'review' : 'reviews'}
                </span>
              )}
              {shoots > 0 && <span>{shoots} Stelli {shoots === 1 ? 'shoot' : 'shoots'}</span>}
              {specialties.length > 0 && <span>{specialties.join(' · ')}</span>}
            </div>
            {creator?.one_liner && <p className="cp-line">{creator.one_liner}</p>}
          </div>
          <div className="cp-cta">
            <div className="cp-actions">
              {preview || !creator?.id ? (
                <span className="cp-btn cp-btn-lime" aria-hidden>{cta}</span>
              ) : (
                <Link ref={ctaRef} to={`/book/${creator.id}`} className="cp-btn cp-btn-lime">
                  {cta}
                </Link>
              )}
              {actions}
            </div>
            {bookingNote && <p className="cp-draft">{bookingNote}</p>}
          </div>
        </section>

        <div className="cp-workbar">
          <h2>
            Work<small>{real.length} {real.length === 1 ? 'photo' : 'photos'}</small>
          </h2>
          {!useGrid && photos.length > 1 && !compact && (
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
          <PrintWall
            photos={photos}
            settings={settings}
            label={label}
            accent={accent}
            name={`${name}'s`}
            showAll={seeAll}
            compact={compact}
            inert={preview}
          />
        </div>
      ) : (
        <div className="cp-wrap">
          <div className="cp-nowork">{firstName} hasn't added work yet.</div>
        </div>
      )}

      <div className="cp-wrap">
        {!preview && creator?.id && <PastShoots lensmanId={creator.id} firstName={firstName} />}

        <div className="cp-details" id="book">
          {hasAbout && (
            <div className="cp-box st-paper">
              {creator.bio && (
                <>
                  <h3>About {firstName}</h3>
                  <p className="cp-bio">{creator.bio}</p>
                </>
              )}
              {hasPrompt && (
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
              {(creator.equipment || years > 0) && (
                <>
                  <h3>In the bag</h3>
                  <p className="cp-bio">
                    {[creator.equipment, years > 0 ? `${years} ${years === 1 ? 'year' : 'years'} shooting` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
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

          <div className="cp-box st-paper">
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
              <Lock strokeWidth={2} aria-hidden />
              {firstName}&apos;s phone and email unlock once your booking is confirmed.
            </div>
          </div>

          {spots.length > 0 && (
            <div className="cp-box st-paper">
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
    </div>
  );
}
