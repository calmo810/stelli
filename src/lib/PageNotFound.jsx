import { Link } from 'react-router-dom';
import useNoIndex from '@/lib/useNoIndex';

/**
 * The one "page not found" screen. A broken link shows it, and so does a page
 * the visitor isn't allowed to open: both look exactly the same, so this page
 * never confirms that a private address exists.
 */
export default function PageNotFound() {
  useNoIndex();

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-ink px-6 py-24">
      <div className="w-full max-w-md text-center">
        <p className="label-mono text-[10px] text-white/35">404</p>
        <h1 className="mt-4 font-heading text-[40px] font-semibold leading-[1.05] text-white">
          Nothing here.
        </h1>
        <p className="mt-4 font-body text-[14px] leading-relaxed text-white/55">
          That page doesn’t exist, or the link is out of date.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-[48px] items-center justify-center px-7 font-body text-[14px] font-semibold"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 980 }}
        >
          Back to Stelli
        </Link>
      </div>
    </div>
  );
}
