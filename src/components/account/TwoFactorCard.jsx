import React from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import SectionLabel from '@/components/creator/SectionLabel';

/**
 * The way in to two-factor sign-in. Setting it up, replacing a method or
 * turning it off all happen on /mfa, which asks you to sign in again first.
 */
export default function TwoFactorCard() {
  return (
    <section>
      <SectionLabel>Two-factor sign-in</SectionLabel>
      <a
        href="/mfa?returnTo=%2Faccount-settings"
        className="glass flex items-center gap-3.5 rounded-3xl px-[18px] py-4 transition-colors hover:bg-white/[0.12]"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.08] text-white/75">
          <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[15px] font-semibold text-white">Set up or manage</b>
          <small className="mt-0.5 block text-[13px] leading-snug text-white/55">
            Add a code from your phone as a second step when you sign in. Someone with your password alone can’t get in.
          </small>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-white/35" strokeWidth={2.4} />
      </a>
    </section>
  );
}
