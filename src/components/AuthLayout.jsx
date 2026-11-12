import React from "react";
import { Link } from "react-router-dom";
import BackButton from '@/components/shared/BackButton';
import CanvasGlow from '@/components/shared/CanvasGlow';
import StelliWordmark from '@/components/shared/StelliWordmark';

/**
 * The canvas every screen outside the main site sits on — sign-in, two-factor,
 * onboarding: the portal's soft light, the way back on the left, the Stelli
 * mark in the middle, and one centred column.
 */
export function AuthCanvas({ children, width = "max-w-[440px]", back = true }) {
  return (
    <div className="relative min-h-screen bg-ink">
      <CanvasGlow />
      <header
        className="relative z-10 mx-auto grid max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center px-5 md:px-10"
        style={{ paddingTop: "calc(16px + var(--safe-top))" }}
      >
        <div>{back && <BackButton />}</div>
        <Link to="/" aria-label="Stelli — home">
          <StelliWordmark />
        </Link>
        <div />
      </header>
      <main className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pb-16 pt-8">
        <div className={`w-full ${width}`}>{children}</div>
      </main>
    </div>
  );
}

/** The title block over a sign-in card: an icon tile, a display headline, one line under it. */
export function AuthHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-7 text-center">
      {Icon && (
        <span className="mb-5 inline-grid h-[52px] w-[52px] place-items-center rounded-2xl bg-white/[0.08] text-white/75">
          <Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
        </span>
      )}
      <h1
        className="font-display font-medium text-white"
        style={{ fontSize: "clamp(30px, 4vw, 38px)", letterSpacing: "-0.02em", lineHeight: 1.05 }}
      >
        {title}
      </h1>
      {subtitle && <p className="mx-auto mt-2.5 max-w-[360px] text-[15px] leading-snug text-white/55">{subtitle}</p>}
    </div>
  );
}

/** One quiet column for every sign-in screen: heading, a glass card, a line under it. */
export default function AuthLayout({ icon, title, subtitle, footer, children }) {
  return (
    <AuthCanvas>
      <AuthHeading icon={icon} title={title} subtitle={subtitle} />
      {children && <div className="glass rounded-[28px] p-5 sm:p-7">{children}</div>}
      {footer && <p className="mt-6 text-center text-[14px] text-white/50">{footer}</p>}
    </AuthCanvas>
  );
}
