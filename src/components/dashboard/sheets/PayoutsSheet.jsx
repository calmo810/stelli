import React from 'react';
import SheetHead from '@/components/dashboard/stack/SheetHead';
import PayoutsCard from '@/components/dashboard/PayoutsCard';
import PayoutNotice from '@/components/dashboard/PayoutNotice';
import { Skeleton } from '@/components/ui/skeleton';
import useCreatorDashboard from '@/hooks/useCreatorDashboard';

export default function PayoutsSheet() {
  const { myProfile, refetchProfile, waitingPayouts, waitingTotal, payoutState } = useCreatorDashboard();

  return (
    <>
      <SheetHead title="Payouts" subtitle="How and when you get paid." />

      <PayoutNotice state={payoutState} onRefresh={refetchProfile} />

      {!myProfile ? (
        <Skeleton className="h-24 rounded-[26px]" />
      ) : (
        <PayoutsCard
          profile={myProfile}
          needsInfo={payoutState?.needsInfo}
          waitingTotal={waitingTotal}
          onRefresh={refetchProfile}
        />
      )}

      <p className="mt-5 px-1.5 text-[14px] leading-relaxed text-white/50">
        {waitingPayouts.length
          ? `${waitingPayouts.length} ${waitingPayouts.length === 1 ? 'shoot is' : 'shoots are'} holding funds until payout setup is finished.`
          : 'Nothing is being held back. Payments release 48 hours after you deliver.'}
      </p>
    </>
  );
}