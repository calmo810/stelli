import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import '@/styles/creatorWorkspace.css';
import '@/styles/creatorContinuity.css';
import { LOGO_URL } from '@/components/shared/StelliWordmark';
import { SECTION_BODIES } from '@/components/creator/form';
import useCreatorApplication from '@/hooks/useCreatorApplication';

function Frame({ children }) {
  return (
    <div className="wk cf-apply">
      <div className="cf-apply__frame">
        <div className="cf-apply__top">
          <Link to="/" aria-label="Stelli home">
            <img src={LOGO_URL} alt="Stelli" />
          </Link>
          <Link to="/" className="cf-apply__exit">
            Save &amp; exit
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * The creator application: four short screens in the portal's own look, then
 * one send. It is the same form the portal edits a profile with — the
 * application is just its first four sections in a row. Everything else about
 * a page (the words, the look, packages) is filled in from the portal later.
 */
export default function CreatorApplication() {
  const app = useCreatorApplication();

  if (app.status === 'has-profile') return <Navigate to="/lensman-dashboard/profile" replace />;

  if (app.status === 'loading') {
    return (
      <Frame>
        {app.loadFailed ? (
          <div className="arch-tab">
            <h1 className="wk-h1">That didn't load.</h1>
            <p className="wk-lede">We couldn't check your account just now.</p>
            <div className="cf-actions">
              <button type="button" className="wk-btn wk-btn--ink" onClick={() => app.retry()}>
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="arch-tab" style={{ minHeight: 320 }} aria-busy="true" />
        )}
      </Frame>
    );
  }

  if (app.status === 'sent') {
    const name = app.form.name.trim();
    return (
      <Frame>
        <div className="arch-tab">
          <span className="cf-sent">
            <Check className="h-7 w-7" strokeWidth={3} />
          </span>
          <h1 className="wk-h1">{name ? `Application sent, ${name}.` : 'Application sent.'}</h1>
          <p className="wk-lede">
            We look at every creator ourselves. You'll get an email as soon as there's a decision, and your page goes
            live the moment you're approved.
          </p>
          <p className="wk-lede">
            While you wait, your portal is open: add a bio, your kit, and choose how your photos hang. None of it is
            required.
          </p>
          <div className="cf-actions">
            <Link to="/lensman-dashboard/profile" className="wk-btn wk-btn--ink">
              Open my portal
            </Link>
          </div>
        </div>
      </Frame>
    );
  }

  const Body = SECTION_BODIES[app.sectionKey];
  const busy = app.sending || app.uploads.uploading;

  return (
    <Frame>
      <p className="wk-kicker">
        Creator application · {app.step + 1} of {app.total}
        {app.step === 0 ? ' · about three minutes' : ''}
      </p>
      <div className="cf-steps" aria-hidden>
        {Array.from({ length: app.total }, (_, i) => (
          <i key={i} className={i <= app.step ? 'is-on' : ''} />
        ))}
      </div>

      <form
        className="arch-tab"
        onSubmit={(event) => {
          event.preventDefault();
          app.next();
        }}
      >
        <h1 className="wk-h1">{app.section.title}</h1>
        <p className="wk-lede">{app.section.lede}</p>

        <div className="wk-card wk-card--pad mt-5">
          <Body form={app.form} set={app.set} uploads={app.uploads} applying />
        </div>

        {app.problem && (
          <p className="cf-error" role="alert">
            {app.problem}
          </p>
        )}

        <div className="cf-actions">
          {app.step > 0 && (
            <button type="button" className="wk-btn wk-btn--ghost" onClick={app.back} disabled={app.sending}>
              Back
            </button>
          )}
          <button type="submit" className="wk-btn wk-btn--ink" disabled={busy}>
            {app.uploads.uploading
              ? app.uploads.note || 'Uploading…'
              : app.last
                ? app.sending ? 'Sending…' : 'Send application'
                : 'Continue'}
          </button>
          <span className="cf-actions__note">{app.saved ? 'Saved' : ''}</span>
        </div>
      </form>
    </Frame>
  );
}
