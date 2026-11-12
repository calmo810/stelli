import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44, errorMessage } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileX2, History } from 'lucide-react';
import useCurrentUser from '@/hooks/useCurrentUser';
import useRequireSignIn from '@/lib/requireSignIn';
import { mediumDate, money, timeLabel } from '@/lib/format';
import { Btn, Card, Check, EmptyState, Note, Page, PageHeader, Sheet, Skeleton, Stat } from '@/components/system';

/** One booking agreement: the facts at the top, the full text, and the creator's acceptance. */
export default function AgreementDetail() {
  const { contractId } = useParams();
  const [agreed, setAgreed] = useState(false);
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useCurrentUser();
  const waiting = useRequireSignIn(user, userLoading);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['booking-contract', contractId],
    enabled: !!user,
    retry: false,
    // An agreement that is missing, or not yours, reads the same: not found.
    queryFn: () => base44.entities.BookingContract.get(contractId).catch(() => null),
  });

  const acceptContract = useMutation({
    // Which side you are is decided on the server, from the booking.
    mutationFn: () => base44.functions.invoke('acceptBookingContract', { bookingId: contract.booking_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['lensman-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-agreements'] });
    },
  });

  const paragraphs = contract?.contract_text?.split('\n').filter(Boolean) || [];
  const superseded = contract?.status === 'superseded';
  const isCreator = Boolean(user && contract && [contract.creator_user_id, contract.creator_id].includes(user.id));
  const needsCreatorAcceptance = contract && !superseded && !contract.creator_accepted_at;

  if (waiting || isLoading) {
    return (
      <Page width="reading">
        <Skeleton className="h-[520px] !rounded-st-lg" />
      </Page>
    );
  }

  if (!contract) {
    return (
      <Page width="reading">
        <Sheet>
          <EmptyState
            icon={FileX2}
            title="Agreement not found."
            body="It may belong to another account, or the link is out of date."
            action={<Btn to="/portal">Back to your portal</Btn>}
          />
        </Sheet>
      </Page>
    );
  }

  const when = [mediumDate(contract.shoot_date), timeLabel(contract.shoot_time)].filter(Boolean).join(' · ');

  return (
    <Page width="reading">
      <Sheet>
        <PageHeader
          kicker="Booking agreement"
          title={<>{contract.format_name || 'Your shoot'} <span className="st-serif">agreement</span></>}
          lede={`Between ${contract.client_name || 'the client'} and ${contract.creator_name || 'the creator'}, arranged through Stelli.`}
          back={{ to: '/portal', label: 'Your portal' }}
        />

        <Card tone="butter" className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          <Stat value={when || 'To be set'} label="Shoot" className="col-span-2 [&_.st-stat\_\_value]:text-[19px]" />
          <Stat value={money(contract.creator_fee ?? contract.base_price)} label="Creator fee" />
          <Stat value={money(contract.total_paid)} label="Client total" />
        </Card>

        <Card as="article" className="mt-3">
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? 'text-[16px] font-semibold leading-relaxed text-fg' : 'text-[15px] leading-[1.75] text-fg-2'}>
                {p}
              </p>
            ))}
          </div>
        </Card>

        {superseded ? (
          <Note tone="warn" icon={History} className="mt-3">
            A newer quote replaced this agreement. It is kept here for the record.
          </Note>
        ) : needsCreatorAcceptance && isCreator ? (
          <Card tone="lime" className="mt-3">
            <h2 className="st-h3">Your acceptance</h2>
            <Check checked={agreed} onChange={setAgreed} className="mt-1">
              I agree to this booking agreement and Stelli's{' '}
              <Link to="/terms" className="st-link" onClick={(e) => e.stopPropagation()}>
                Terms and Conditions
              </Link>
              .
            </Check>
            {acceptContract.isError && (
              <Note tone="error" className="mt-2">{errorMessage(acceptContract.error, 'That did not save. Try again.')}</Note>
            )}
            <Btn onClick={() => acceptContract.mutate()} disabled={!agreed} loading={acceptContract.isPending} className="mt-3">
              Accept agreement
            </Btn>
          </Card>
        ) : needsCreatorAcceptance ? (
          <Note tone="info" className="mt-3">You have accepted this agreement. It is waiting on the creator.</Note>
        ) : (
          <Note tone="success" icon={CheckCircle2} className="mt-3">
            Accepted by both sides{contract.creator_accepted_at ? ` on ${mediumDate(contract.creator_accepted_at)}` : ''}. This copy is read-only.
          </Note>
        )}
      </Sheet>
    </Page>
  );
}
