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
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-24" role="alert">
        <div className="w-full max-w-md text-center">
          <h1 className="font-heading text-[34px] font-semibold leading-[1.05] text-white">
            {stale ? 'Stelli was just updated.' : 'Something broke on this screen.'}
          </h1>
          <p className="mt-4 font-body text-[14px] leading-relaxed text-white/60">
            {stale
              ? 'Reload to get the newest version. Nothing you saved is lost.'
              : 'Nothing you saved is lost. Reload the page, or head back to the start.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-neon-lime px-7 font-body text-[14px] font-semibold text-ink"
            >
              Reload
            </button>
            <a
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 px-7 font-body text-[14px] font-semibold text-white/80 hover:text-white"
            >
              Back to Stelli
            </a>
          </div>
        </div>
      </div>
    );
  }
}
