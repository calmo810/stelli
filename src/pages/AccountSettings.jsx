import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import CanvasGlow from '@/components/shared/CanvasGlow';
import LoginEmailBox from '@/components/account/LoginEmailBox';
import PasswordBox from '@/components/account/PasswordBox';
import DeleteAccountCard from '@/components/account/DeleteAccountCard';
import TwoFactorCard from '@/components/account/TwoFactorCard';
import { isGoogleUser } from '@/lib/authProvider';
import useRequireSignIn from '@/lib/requireSignIn';

/** The portal's canvas and column. Its light fades in under the back button. */
function Shell({ children }) {
  return (
    <div className="relative min-h-screen bg-ink">
      <CanvasGlow />
      <div className="relative mx-auto w-full max-w-[640px] px-4 pb-24 pt-8 sm:px-5">{children}</div>
    </div>
  );
}

/** Account settings, on the same glass canvas as the portal. */
export default function AccountSettings() {
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });
  // Signed out: log in, then come straight back here (it used to spin forever).
  const waiting = useRequireSignIn(user, isLoading);

  if (waiting || !user) {
    return (
      <Shell>
        <div className="glass h-12 w-2/3 animate-pulse rounded-2xl" />
        <div className="glass mt-8 h-[88px] animate-pulse rounded-3xl" />
        <div className="glass mt-4 h-[260px] animate-pulse rounded-3xl" />
      </Shell>
    );
  }

  const googleUser = isGoogleUser(user);

  return (
    <Shell>
      <h1
        className="font-display font-medium text-white"
        style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1.05 }}
      >
        Account settings
      </h1>

      <LoginEmailBox email={user.email} googleUser={googleUser} />
      <PasswordBox user={user} googleUser={googleUser} />
      <TwoFactorCard />
      <DeleteAccountCard />
    </Shell>
  );
}
