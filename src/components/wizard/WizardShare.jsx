import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Instagram } from 'lucide-react';
import { sharePreviewUrl } from '@/lib/creatorProfile';

/** What a creator sees once their profile is in. */
export default function WizardShare({ w }) {
  const { s } = w;
  const name = s.name.trim();
  const caption = `Now booking on Stelli ✦ ${s.what.slice(0, 2).join(' + ').toLowerCase() || 'shoots'} around Elon. Link in bio.`;
  const heading = w.approved ? "You're live" : "You're in";

  return (
    <div className="share">
      <div className="big-check" aria-hidden>
        <Check className="w-8 h-8" strokeWidth={3} />
      </div>

      <h1>{name ? `${heading}, ${name}.` : `${heading}.`}</h1>
      <p>
        {w.approved
          ? 'Your page is up to date. Now put it where clients will actually see it.'
          : "Your page is with us for review. It goes live the moment you're approved, and the link below starts working then."}
      </p>

      <div className="url-box">
        <span className="u">{w.linkLabel}</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => w.copy(w.link, 'Link copied')}>
          Copy link
        </button>
      </div>

      <div className="share-actions">
        <Link to="/lensman-dashboard/profile" className="btn btn-primary btn-sm">
          Go to your portal
        </Link>
        {w.approved && typeof navigator !== 'undefined' && navigator.share && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              navigator.share({ title: `Book ${name} on Stelli`, url: sharePreviewUrl(w.lensman) }).catch(() => {});
            }}
          >
            Share…
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={w.openReview}>
          {w.approved ? 'Keep editing' : 'Review my page'}
        </button>
      </div>

      <div className="ig-card">
        <h3>
          <Instagram className="w-5 h-5" aria-hidden /> Add it to your Instagram
        </h3>
        <p>Most Elon clients will find you through Instagram. Two minutes, and every profile visit becomes a possible booking.</p>
        <ol className="ig-steps">
          <li>
            <span>Copy your Stelli link above.</span>
          </li>
          <li>
            <span>
              In Instagram, go to <b>Edit profile → Links → Add external link</b>.
            </span>
          </li>
          <li>
            <span>Paste it and title it “Book me”.</span>
          </li>
        </ol>
        <div className="share-actions" style={{ justifyContent: 'flex-start' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={async () => {
              await w.copy(w.link, 'Link copied. Paste it in Edit profile → Links');
              window.open('https://www.instagram.com/accounts/edit/', '_blank', 'noopener');
            }}
          >
            Copy link &amp; open Instagram
          </button>
        </div>

        <span className="lbl subhead">Story caption</span>
        <div className="caption">
          <span>{caption}</span>
          <button type="button" className="link-btn" onClick={() => w.copy(`${caption} ${w.link}`, 'Caption copied')}>
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
