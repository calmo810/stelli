import React, { useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock } from 'lucide-react';
import { viewerRole, firstName } from '@/lib/threadStatus';
import ThreadHeader from '@/components/thread/ThreadHeader';
import RequestCard from '@/components/thread/RequestCard';
import QuoteCard from '@/components/thread/QuoteCard';
import HeldPaymentNote from '@/components/thread/HeldPaymentNote';
import MessageBubble from '@/components/thread/MessageBubble';
import SystemNotice from '@/components/thread/SystemNotice';
import JustSentBanner from '@/components/thread/JustSentBanner';
import ThreadComposer from '@/components/thread/ThreadComposer';
import QuoteComposer from '@/components/thread/QuoteComposer';
import DeliveryCard from '@/components/thread/DeliveryCard';

export default function Messages() {
  const { bookingId } = useParams();
  const [params] = useSearchParams();
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
        <div className="max-w-md mx-auto border border-white/10 p-8 text-center" style={{ borderRadius: 4 }}>
          <Lock className="w-5 h-5 mx-auto mb-4 text-white/30" />
          <h1 className="font-heading text-2xl font-semibold text-white mb-3">
            This conversation isn't yours.
          </h1>
          <p className="font-body text-[13px] text-white/45 mb-6">
            Sign in with the account that made this booking to open it.
          </p>
          <Link to="/portal" className="label-mono text-[10px] font-semibold px-6 py-3 inline-block" style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}>
            Go to your portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pb-44">
      <ThreadHeader
        booking={booking}
        creator={creator}
        role={role}
        talkingTo={talkingTo}
        profileHref={role === 'client' && booking.lensman_id ? `/creators/${booking.lensman_id}` : null}
      />

      <div className="max-w-3xl mx-auto px-5 md:px-8 py-6 space-y-5">
        {params.get('payment') === 'success' && (
          <p className="label-mono text-[10px]" style={{ color: 'hsl(var(--neon-lime))' }}>
            Payment received — the date is locked in.
          </p>
        )}

        {role === 'client' && <JustSentBanner bookingId={booking.id} creatorName={creatorName} />}

        <RequestCard booking={booking} />

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
          <p className="font-body text-[13px] text-white/35 text-center py-2">
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

      {role === 'lensman' && !booking.payment_status?.includes('held') && (
        <div className="fixed bottom-24 right-5 md:right-8 z-40">
          <QuoteComposer
            booking={booking}
            payoutsReady={Boolean(creator?.payouts_enabled)}
            onSent={refreshBooking}
          />
        </div>
      )}
    </div>
  );
}