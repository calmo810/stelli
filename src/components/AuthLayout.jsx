import React from "react";
import { Link } from "react-router-dom";
import BackButton from '@/components/shared/BackButton';
import StelliWordmark from '@/components/shared/StelliWordmark';
import { Sheet } from '@/components/system';

/**
 * One column for every sign-in screen: the wordmark and the way back on the
 * ink, the form on a sheet of paper. `bare` drops the header for a screen that
 * brings its own (the two-factor steps).
 */
export default function AuthLayout({ icon: Icon, title, subtitle, footer, bare = false, children }) {
  return (
    <div className="st-page st-ink">
      <div
        className="st-wrap st-wrap--form flex min-h-screen flex-col"
        style={{ paddingTop: 'calc(14px + var(--safe-top))', paddingBottom: 'calc(20px + var(--safe-bottom))' }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link to="/" aria-label="Stelli home" className="rounded-lg">
            <StelliWordmark />
          </Link>
          <BackButton />
        </div>

        <main className="flex flex-1 flex-col justify-center py-7">
          <Sheet>
            {!bare && (
              <header className="mb-6">
                {Icon && (
                  <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-tint-lime text-[var(--tint-lime-ink)]">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={2} aria-hidden="true" />
                  </span>
                )}
                <h1 className="st-h1">{title}</h1>
                {subtitle && <p className="st-lede mt-2.5">{subtitle}</p>}
              </header>
            )}
            {children}
          </Sheet>

          {footer && <p className="mt-6 text-center text-[14.5px] text-fg-2">{footer}</p>}
        </main>
      </div>
    </div>
  );
}
