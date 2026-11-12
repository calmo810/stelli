import useNoIndex from '@/lib/useNoIndex';
import { Btn, Page, Sheet } from '@/components/system';

/**
 * The one "page not found" screen. A broken link shows it, and so does a page
 * the visitor isn't allowed to open: both look exactly the same, so this page
 * never confirms that a private address exists.
 */
export default function PageNotFound() {
  useNoIndex();

  return (
    <Page width="narrow">
      <Sheet className="st-aurora st-aurora--sky px-6 py-14 text-center sm:py-20">
        <p className="st-kicker">404</p>
        <h1 className="st-display mt-3">
          Nothing <span className="st-serif">here.</span>
        </h1>
        <p className="st-lede mx-auto mt-5">That page doesn’t exist, or the link is out of date.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Btn to="/" variant="ink" arrow="end">
            Back to Stelli
          </Btn>
          <Btn to="/creators" variant="outline">
            Browse creators
          </Btn>
        </div>
      </Sheet>
    </Page>
  );
}
