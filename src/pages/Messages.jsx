import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Lock } from 'lucide-react';
import { viewerRole, firstName } from '@/lib/threadStatus';
import ThreadHeader from '@/components/thread/ThreadHeader';
import RequestCard from '@/components/thread/RequestCard';
import QuoteCard from '@/components/thread/QuoteCard';
import HeldPaymentNote from '@/components/thread/HeldPaymentNote';
import MessageBubble from '@/components/thread/MessageBubble';
import SystemNotice from '@/components/thread/SystemNotice';
import JustSentBanner from '@/components/thread/JustSentBanner';
import Pill from '@/components/shared/Pill';
import ThreadComposer from '@/components/thread/ThreadComposer';
import QuoteComposer from '@/components/thread/QuoteComposer';
import DeliveryCard from '@/components/thread/DeliveryCard';

export default function Messages() {
  const { bookingId } = useParams();
  const [params] = useSearchParams();
  const [quoting, setQuoting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['thread-user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const list = await base44.entities.Booking.filter({ id: bookingId });
      return list[0] || null;
    },
    enabled: !!bookingId,
  });

  const { data: creator } = useQuery({
    queryKey: ['thread-creator', booking?.lensman_id],
    enabled: !!booking?.lensman_id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id: booking.lensman_id });
      return list[0] || null;
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['thread-messages', bookingId],
    queryFn: () => base44.entities.Message.filter({ booking_id: bookingId }, 'created_date'),
    enabled: !!bookingId,
    refetchInterval: 4000,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['thread-quotes', bookingId],
    queryFn: () => base44.entities.Quote.filter({ booking_id: bookingId }, 'created_date'),
    enabled: !!bookingId,
    refetchInterval: 4000,
  });

  const role = viewerRole(booking, user);

  // Opening the thread clears the lime dot on the account, not the browser.
  useEffect(() => {
    if (!bookingId || !role) return;
    base44.functions
      .invoke('markThreadRead', { bookingId })
      .then(() => queryClient.invalidateQueries({ queryKey: ['booking', bookingId] }))
      .catch(() => {});
  }, [bookingId, role, queryClient]);

  const creatorName = creator?.display_name || creator?.full_name || booking?.lensman_name || '';
  const talkingTo = role === 'lensman' ? booking?.client_name : creatorName;

  const items = useMemo(() => {
    const chat = messages
      .filter((m) => m.kind !== 'system')
      .map((m) => ({ type: 'message', date: new Date(m.created_date || 0).getTime(), data: m }));
    const cards = quotes.map((q) => ({
      type: 'quote',
      date: new Date(q.created_date || 0).getTime(),
      data: q,
    }));
    return [...chat, ...cards].sort((a, b) => a.date - b.date);
  }, [messages, quotes]);

  const systemNotices = messages.filter((m) => m.kind === 'system');

  const sendMessage = async (text) => {
    await base44.functions.invoke('sendMessage', { bookingId, content: text });
    await queryClient.invalidateQueries({ queryKey: ['thread-messages', bookingId] });
  };

  const refreshBooking = () =>
    queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });

  if (userLoading || bookingLoading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-neon-lime" />
      </div>
    );
  }

  if (!booking || !role) {
    return (
      <div className="min-h-screen bg-ink px-5 pt-32 pb-24">
        <div className="glass mx-auto max-w-[440px] rounded-[28px] p-7 text-center">
          <Lock className="mx-auto mb-4 h-5 w-5 text-white/35" />
          <h1 className="text-[22px] font-semibold text-white">This conversation isn't yours.</h1>
          <p className="mt-2 text-[14px] text-white/50">
            Sign in with the account that made this booking to open it.
          </p>
          <Link to="/portal" className="mt-5 inline-block">
            <Pill>Go to your portal</Pill>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pb-52">
      <ThreadHeader
        booking={booking}
        creator={creator}
        role={role}
        talkingTo={talkingTo}
        profileHref={role === 'client' && booking.lensman_id ? `/creators/${booking.lensman_id}` : null}
      />

      <div className="mx-auto w-full max-w-[640px] space-y-4 px-4 py-5 sm:px-5">
        {params.get('payment') === 'success' && (
          <p
            className="rounded-[980px] px-4 py-2.5 text-center text-[13px] font-semibold"
            style={{ background: 'hsl(var(--neon-lime) / 0.14)', color: 'hsl(var(--neon-lime))' }}
          >
            Payment received — the date is locked in.
          </p>
        )}

        {role === 'client' && <JustSentBanner bookingId={booking.id} creatorName={creatorName} />}

        <RequestCard booking={booking} />

        {role === 'lensman' && !booking.payment_status?.includes('held') && (
          <Pill
            as="button"
            type="button"
            tone="lime"
            onClick={() => setQuoting(true)}
            className="w-full py-4"
          >
            <FileText className="h-4 w-4" /> Send a quote
          </Pill>
        )}

        <HeldPaymentNote booking={booking} role={role} />

        {items.map((item) =>
          item.type === 'quote' ? (
            <QuoteCard
              key={item.data.id}
              quote={item.data}
              booking={booking}
              role={role}
              onChanged={refreshBooking}
            />
          ) : (
            <MessageBubble
              key={item.data.id}
              message={item.data}
              isOwn={item.data.sender_role === role}
              isCreatorView={role === 'lensman'}
            />
          )
        )}

        <DeliveryCard booking={booking} role={role} onChanged={refreshBooking} />

        {systemNotices.map((notice) => (
          <SystemNotice key={notice.id} message={notice} />
        ))}

        {items.length === 0 && !booking.payment_status?.includes('held') && (
          <p className="py-2 text-center text-[13px] text-white/35">
            {role === 'client'
              ? `${firstName(creatorName)} will reply here. Add anything you forgot below.`
              : 'Reply to work out the details, then send your quote.'}
          </p>
        )}
      </div>

      <ThreadComposer
        booking={booking}
        onSend={sendMessage}
        placeholder={role === 'client' ? `Message ${firstName(creatorName)}...` : `Message ${firstName(booking.client_name)}...`}
      />

      <QuoteComposer
        open={quoting}
        onClose={() => setQuoting(false)}
        booking={booking}
        payoutsReady={Boolean(creator?.payouts_enabled)}
        onSent={refreshBooking}
      />
    </div>
  );
}