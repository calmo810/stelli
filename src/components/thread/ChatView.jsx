import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { Loader2, Lock } from 'lucide-react';
import { viewerRole, firstName } from '@/lib/threadStatus';
import ThreadHeader from '@/components/thread/ThreadHeader';
import RequestSummary from '@/components/thread/RequestSummary';
import QuoteCard from '@/components/thread/QuoteCard';
import HeldPaymentNote from '@/components/thread/HeldPaymentNote';
import MessageBubble from '@/components/thread/MessageBubble';
import SystemNotice from '@/components/thread/SystemNotice';
import JustSentBanner from '@/components/thread/JustSentBanner';
import Pill from '@/components/shared/Pill';
import ThreadComposer from '@/components/thread/ThreadComposer';
import QuoteComposer from '@/components/thread/QuoteComposer';
import DeliveryCard from '@/components/thread/DeliveryCard';

const CREATOR_SUGGESTIONS = [
  'Thanks for reaching out!',
  "What's the vibe you're going for?",
  'Is the time flexible?',
  'How many people will be there?',
];

function dayLabel(ms) {
  const date = new Date(ms);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMM d');
}

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

/** One conversation: header, the thread, and the message box. Fills whatever space it is given. */
export default function ChatView({ bookingId }) {
  const [params] = useSearchParams();
  const [quoting, setQuoting] = useState(false);
  const queryClient = useQueryClient();
  const scroller = useRef(null);
  const firstScroll = useRef(true);

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
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
        queryClient.invalidateQueries({ queryKey: ['messages-inbox'] });
      })
      .catch(() => {});
  }, [bookingId, role, queryClient, messages.length]);

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

  // Stay at the newest message — but never yank someone who scrolled up to reread.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 180;
    if (firstScroll.current || nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: firstScroll.current ? 'auto' : 'smooth' });
      if (booking) firstScroll.current = false;
    }
  }, [items.length, systemNotices.length, booking]);

  const sendMessage = async (text) => {
    const res = await base44.functions.invoke('sendMessage', { bookingId, content: text });
    const sent = res?.data?.message || res?.message;
    if (sent) {
      queryClient.setQueryData(['thread-messages', bookingId], (old = []) =>
        old.some((m) => m.id === sent.id) ? old : [...old, sent]
      );
    }
    // Your own message always scrolls into view.
    firstScroll.current = true;
    await queryClient.invalidateQueries({ queryKey: ['thread-messages', bookingId] });
    queryClient.invalidateQueries({ queryKey: ['messages-inbox'] });
  };

  const refreshBooking = () => {
    queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    queryClient.invalidateQueries({ queryKey: ['thread-quotes', bookingId] });
  };

  if (userLoading || bookingLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-neon-lime" />
      </div>
    );
  }

  if (!booking || !role) {
    return (
      <div className="flex h-full items-center justify-center px-5">
        <div className="glass w-full max-w-[440px] rounded-[28px] p-7 text-center">
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

  const canQuote = role === 'lensman' && !booking.payment_status?.includes('held');
  const myMessageCount = messages.filter((m) => m.kind !== 'system' && m.sender_role === role).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ThreadHeader
        booking={booking}
        creator={creator}
        role={role}
        talkingTo={talkingTo}
        profileHref={role === 'client' && booking.lensman_id ? `/creators/${booking.lensman_id}` : null}
        onQuote={canQuote ? () => setQuoting(true) : null}
      />

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[720px] space-y-1.5 px-4 py-5 sm:px-6">
          {params.get('payment') === 'success' && (
            <p
              className="mb-3 rounded-[980px] px-4 py-2.5 text-center text-[13px] font-semibold"
              style={{ background: 'hsl(var(--neon-lime) / 0.14)', color: 'hsl(var(--neon-lime))' }}
            >
              Payment received — the date is locked in.
            </p>
          )}

          {role === 'client' && <JustSentBanner bookingId={booking.id} creatorName={creatorName} />}

          <div className="pb-3">
            <RequestSummary booking={booking} />
          </div>

          <HeldPaymentNote booking={booking} role={role} />

          {items.map((item, i) => {
            const prev = items[i - 1];
            const next = items[i + 1];
            const newDay = !prev || !sameDay(prev.date, item.date);
            const divider = newDay ? (
              <p className="pb-2 pt-4 text-center text-[11px] font-semibold text-white/30">
                {dayLabel(item.date).toUpperCase()}
              </p>
            ) : null;

            if (item.type === 'quote') {
              return (
                <React.Fragment key={item.data.id}>
                  {divider}
                  <div className="py-2">
                    <QuoteCard quote={item.data} booking={booking} role={role} onChanged={refreshBooking} />
                  </div>
                </React.Fragment>
              );
            }

            const sameSenderAsNext =
              next &&
              next.type === 'message' &&
              next.data.sender_role === item.data.sender_role &&
              sameDay(next.date, item.date) &&
              next.date - item.date < 5 * 60 * 1000;

            return (
              <React.Fragment key={item.data.id}>
                {divider}
                <div className={sameSenderAsNext ? '' : 'pb-2'}>
                  <MessageBubble
                    message={item.data}
                    isOwn={item.data.sender_role === role}
                    isCreatorView={role === 'lensman'}
                    isLastInGroup={!sameSenderAsNext}
                  />
                </div>
              </React.Fragment>
            );
          })}

          <DeliveryCard booking={booking} role={role} onChanged={refreshBooking} />

          {systemNotices.map((notice) => (
            <SystemNotice key={notice.id} message={notice} />
          ))}

          {items.length === 0 && !booking.payment_status?.includes('held') && (
            <p className="py-6 text-center text-[13px] text-white/35">
              {role === 'client'
                ? `${firstName(creatorName)} will reply here. Add anything you forgot below.`
                : 'Say hi and work out the details, then send your quote.'}
            </p>
          )}
        </div>
      </div>

      <ThreadComposer
        booking={booking}
        onSend={sendMessage}
        suggestions={role === 'lensman' && myMessageCount === 0 ? CREATOR_SUGGESTIONS : []}
        placeholder={
          role === 'client' ? `Message ${firstName(creatorName)}...` : `Message ${firstName(booking.client_name)}...`
        }
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
