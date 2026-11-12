import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Btn, Card } from '@/components/system';

/**
 * The way in to two-factor sign-in. Setting it up, replacing a method or
 * turning it off all happen on /mfa, which asks you to sign in again first.
 */
export default function TwoFactorCard() {
  return (
    <Card as="section" aria-labelledby="mfa-title" className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-tint-lime text-[var(--tint-lime-ink)]" aria-hidden>
        <ShieldCheck className="h-[22px] w-[22px]" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="mfa-title" className="st-h3">Two-factor sign-in</h2>
        <p className="st-body mt-1">
          Add a code from your phone as a second step. Someone with your password alone can’t get in.
        </p>
      </div>
      <Btn href="/mfa?returnTo=%2Faccount-settings" variant="outline" className="shrink-0">
        Set up or manage
      </Btn>
    </Card>
  );
}
