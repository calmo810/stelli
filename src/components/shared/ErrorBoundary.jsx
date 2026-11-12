import React from 'react';

/** A page's code failed to download: usually a new version went live while the tab was open. */
const isStaleChunk = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    String(error?.message || error || '')
  );

const RELOADED_KEY = 'stelli_reloaded_for_update';

/**
 * The last line of defence: if a screen throws while drawing, the visitor gets
 * a plain way forward instead of a blank page.
 *
 * A page that can't download its code after an update reloads itself once,
 * which is nearly always the whole fix; the screen below only shows if that
 * did not help.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('Screen failed to render:', error);
    if (!isStaleChunk(error)) return;
    try {
      if (sessionStorage.getItem(RELOADED_KEY)) return;
      sessionStorage.setItem(RELOADED_KEY, '1');
    } catch {
      return;
    }
    window.location.reload();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const stale = isStaleChunk(error);

    return (
      <div className="st-page st-ink flex min-h-screen items-center justify-center px-3 py-16" role="alert">
        <div className="st-sheet st-paper w-full max-w-md px-6 py-10 text-center">
          <h1 className="st-h1">
            {stale ? 'Stelli was just updated.' : 'Something broke on this screen.'}
          </h1>
          <p className="st-body mt-4">
            {stale
              ? 'Reload to get the newest version. Nothing you saved is lost.'
              : 'Nothing you saved is lost. Reload the page, or head back to the start.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="st-btn st-btn--primary"
            >
              Reload
            </button>
            <a
              href="/"
              className="st-btn st-btn--outline"
            >
              Back to Stelli
            </a>
          </div>
        </div>
      </div>
    );
  }
}
