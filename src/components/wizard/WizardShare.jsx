import React from 'react';
import { Check, Instagram } from 'lucide-react';
import { EXTRAS } from '@/lib/wizardData';

/**
 * What a creator sees once something has been sent or saved.
 *
 * A live page gets the share kit. Anyone still waiting on a decision gets
 * what happens next and the optional parts of their page to fill in — never a
 * link to share, because that link does not work until they are approved.
 */
export default function WizardShare({ w }) {
  const { s } = w;
  const name = s.name.trim();

  if (!w.approved) {
    const has = (key) => w.steps.some((step) => step.key === key);
    const extras = EXTRAS.filter((extra) => !extra.ok(s) && has(extra.k));
    const firstExtra = extras[0]?.k;
    const sentBack = w.justSent === 'resubmitted';
    const savedOnly = w.justSent === 'saved';

    let title = 'Application sent.';
    if (sentBack) title = 'Sent back to us.';
    else if (savedOnly) title = 'Saved.';
    if (name && !savedOnly) title = sentBack ? `Sent back, ${name}.` : `Application sent, ${name}.`;

    return (
      <div className="share">
        <div className="big-check">
          <Check className="w-8 h-8" strokeWidth={3} />
        </div>

        <h1>{title}</h1>
        <p>
          {savedOnly
            ? "Your changes are saved. Your page goes live the moment you're approved."
            : "We look at every creator ourselves. You'll get an email as soon as there's a decision, and your page goes live the moment you're approved."}
        </p>

        {extras.length > 0 && (
          <div className="ig-card">
            <h3>While you wait, finish your page</h3>
            <p>None of this is required. It's what makes a client pick you once you're live.</p>
            <div className="tips" style={{ marginTop: 14 }}>
              {extras.map((extra) => (
                <button key={extra.t} type="button" className="tip" onClick={() => w.goKey(extra.k)}>
                  + {extra.t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="share-actions">
          {firstExtra && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => w.goKey(firstExtra)}>
              Finish my page
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => w.setView('preview')}>
            View my page
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={w.exit}>
            Go to my dashboard
          </button>
        </div>
      </div>
    );
  }

  const caption = `Now booking on Stelli ✦ ${s.what.slice(0, 2).join(' + ').toLowerCase() || 'shoots'} around Elon. Link in bio.`;

  return (
    <div className="share">
      <div className="big-check">
        <Check className="w-8 h-8" strokeWidth={3} />
      </div>

      <h1>{name ? `You're live, ${name}.` : "You're live."}</h1>
      <p>Your page is up. Now put it where clients will actually see it.</p>

      <div className="url-box">
        <span className="u">{w.linkLabel}</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => w.copy(w.link, 'Link copied')}>
          Copy link
        </button>
      </div>

      <div className="share-actions">
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              navigator.share({ title: `Book ${s.name} on Stelli`, url: w.link }).catch(() => {});
            }}
          >
            Share…
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => w.setView('preview')}>
          View my page
        </button>
      </div>

      <div className="ig-card">
        <h3>
          <Instagram className="w-5 h-5" /> Add it to your Instagram
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
