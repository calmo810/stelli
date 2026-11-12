import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Check, MessageCircle, SearchX } from 'lucide-react';
import { longDate, timeLabel } from '@/lib/format';
import { Avatar, Btn, Card, EmptyState, Page, Sheet, Skeleton } from '@/components/system';

/** Lands here the moment a booking request is filed. */
export default function RequestSent() {
  const { bookingId } = useParams();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['request-sent-booking', bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const list = await base44.entities.Booking.filter({ id: bookingId });
      return list[0] || null;
    },
  });

  const { data: creator } = useQuery({
    queryKey: ['request-sent-creator', booking?.lensman_id],
    enabled: !!booking?.lensman_id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id: booking.lensman_id });
      return list[0] || null;
    },
  });

  if (isLoading) {
    return (
      <Page width="narrow">
        <Skeleton className="h-[460px] !rounded-st-lg" />
      </Page>
    );
  }

  // Someone else's request, or a link that never existed: nothing to show.
  if (!booking) {
    return (
      <Page width="narrow">
        <Sheet>
          <EmptyState
            icon={SearchX}
            title="We couldn't find that request."
            body="It may belong to another account. Your requests are all in your messages."
            action={<Btn to="/messages">Go to messages</Btn>}
          />
        </Sheet>
      </Page>
    );
  }

  const name = creator?.display_name || booking.lensman_name || 'your creator';
  const firstName = name.split(' ')[0];
  const photo = creator?.profile_image || creator?.portfolio_images?.[0] || '';
  const when = [longDate(booking.event_date), timeLabel(booking.event_time)].filter(Boolean).join(' · ');

  const steps = [
    [`${firstName} looks at your date.`, 'Most creators reply within a day.'],
    ['You talk it through here.', 'Messages stay on Stelli until the booking is confirmed.'],
    ['You get a private quote.', 'Nothing is charged until you accept it.'],
  ];

  return (
    <Page width="narrow">
      <Sheet className="st-rise">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-neon-lime text-ink" aria-hidden>
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
        <p className="st-kicker mt-6">Request filed</p>
        <h1 className="st-display mt-2">
          Request <span className="st-serif">sent.</span>
        </h1>

        <Card tone="lime" className="mt-7 flex items-center gap-4">
          <Avatar src={photo} name={name} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-[20px] font-extrabold tracking-[-0.03em]">{name}</p>
            {when && <p className="mt-0.5 text-[13.5px] text-fg-2">Requested for {when}</p>}
          </div>
        </Card>

        <h2 className="st-kicker mt-8">What happens next</h2>
        <ol className="mt-3 space-y-3.5">
          {steps.map(([lead, rest], i) => (
            <li key={lead} className="flex gap-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-white" aria-hidden>
                {i + 1}
              </span>
              <p className="text-[15px] leading-snug text-fg-2">
                <b className="font-semibold text-fg">{lead}</b> {rest}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
          <Btn to={`/messages/${booking.id}`} size="lg" className="sm:flex-1">
            <MessageCircle aria-hidden /> Go to messages
          </Btn>
          <Btn to="/creators" variant="outline" size="lg">
            Keep browsing
          </Btn>
        </div>
      </Sheet>
    </Page>
  );
}
