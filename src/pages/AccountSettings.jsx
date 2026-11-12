import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loading, Page, PageHeader, Sheet } from '@/components/system';
import LoginEmailBox from '@/components/account/LoginEmailBox';
import PasswordBox from '@/components/account/PasswordBox';
import DeleteAccountCard from '@/components/account/DeleteAccountCard';
import TwoFactorCard from '@/components/account/TwoFactorCard';
import { isGoogleUser } from '@/lib/authProvider';
import useRequireSignIn from '@/lib/requireSignIn';
import useCurrentUser from '@/hooks/useCurrentUser';

export default function AccountSettings() {
  const { user, isLoading } = useCurrentUser();
  // Signed out: log in, then come straight back here (it used to spin forever).
  const waiting = useRequireSignIn(user, isLoading);

  const { data: lensman } = useQuery({
    queryKey: ['my-lensman-exists', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  if (waiting || !user) {
    return (
      <Page width="narrow">
        <Loading label="Loading your account" className="min-h-[50vh]" />
      </Page>
    );
  }

  const googleUser = isGoogleUser(user);

  return (
    <Page width="narrow">
      <Sheet>
        <PageHeader
          kicker={lensman ? 'Creator account' : 'Client account'}
          title="Account"
          lede="How you sign in, and how to leave."
          back={{ to: '/portal', label: 'Your portal' }}
        />
        <div className="mt-7 space-y-3">
          <LoginEmailBox email={user.email} googleUser={googleUser} />
          <PasswordBox user={user} googleUser={googleUser} />
          <TwoFactorCard />
          <DeleteAccountCard />
        </div>
      </Sheet>
    </Page>
  );
}
