import React from 'react';

/**
 * The way in to two-factor sign-in. Setting it up, replacing a method or
 * turning it off all happen on /mfa, which asks you to sign in again first.
 */
export default function TwoFactorCard() {
  return (
    <section
      className="border p-6"
      style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}
    >
      <h2 className="font-heading text-2xl font-semibold text-white mb-3">Two-factor sign-in</h2>
      <p className="font-body text-[14px] leading-relaxed text-white/60">
        Add a code from your phone as a second step when you sign in. Someone with your password alone can’t get in.
      </p>
      <a
        href="/mfa?returnTo=%2Faccount-settings"
        className="mt-5 inline-flex min-h-[44px] items-center border border-white/15 px-5 font-body text-[14px] font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        style={{ borderRadius: 4 }}
      >
        Set up or manage
      </a>
    </section>
  );
}
