import React, { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Timer,
  Users,
  Wallet,
  MessageCircle,
  FileText,
} from 'lucide-react';
import QuoteComposer from '@/components/thread/QuoteComposer';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import Pill from '@/components/shared/Pill';
import money from '@/lib/money';
import { statusChip } from '@/lib/threadStatus';
import { deadlineFor } from '@/hooks/useCreatorPortal';

function Fact({ icon: Icon, label, value, wide = false }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/35">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </p>
      <p className="mt-1 text-[15px] leading-snug text-white">{value || 'Not given'}</p>
    </div>
  );
}

/**
 * One request, everything about it, and the two things a creator does with it:
 * talk to the client, or send a price. No digging through a chat to find the date.
 */
export default function CreatorRequestDetail() {
  const { bookingId } = useParams();
  const { bookings, myProfile, quotesFor, isLoading, refresh } = useOutletContext();
  const queryClient = useQueryClient();
  const [quoting, setQuoting] = useState(false);

  const booking = bookings.find((b) => b.id === bookingId);

  if (isLoading && !booking) {
    return <div className="glass h-[320px] animate-pulse rounded-[28px]" />;
  }

  if (!booking) {
    return (
      <div>
        <Link to="/lensman-dashboard/requests" className="inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Requests
        </Link>
        <div className="mt-5">
          <EmptyPanel
            icon={FileText}
            title="Request not found"
            body="This request is no longer available on your profile."
          />
        </div>
      </div>
    );
  }

  const isNew = booking.status === 'requested';
  const deadline = isNew ? deadlineFor(booking) : null;
  const late = deadline ? deadline.getTime() < Date.now() : false;
  const quotes = quotesFor(booking.id);
  const liveQuote = quotes.find((q) => q.status === 'sent');
  const acceptedQuote = quotes.find((q) => q.status === 'accepted');
  const canQuote = ['requested', 'quoted'].includes(booking.status);

  const date = booking.event_date
    ? format(new Date(`${booking.event_date}T12:00:00`), 'EEEE, MMM d, yyyy')
    : 'To be decided';

  const onQuoteSent = () => {
    refresh();
    queryClient.invalidateQueries({ queryKey: ['creator-quotes'] });
  };

  return (
    <div>
      <Link
        to="/lensman-dashboard/requests"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Requests
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide"
          style={{ background: 'hsl(var(--neon-cyan) / 0.14)', color: 'hsl(var(--neon-cyan))' }}
        >
          {statusChip(booking.status)}
        </span>
        {deadline && (
          <span
            className="text-[12px] font-medium"
            style={{ color: late ? 'hsl(var(--neon-magenta))' : 'rgba(255,255,255,0.45)' }}
          >
            {late
              ? 'Reply window closed'
              : `Reply by ${format(deadline, 'MMM d, h:mm a')}`}
          </span>
        )}
      </div>

      <h1 className="mt-2 font-display text-[32px] font-medium leading-tight text-white">
        {booking.client_name || 'Client'}
      </h1>
      <p className="mt-1 text-[14px] capitalize text-white/50">
        {booking.event_type || 'A shoot'}
      </p>

      <div className="glass mt-5 rounded-[26px] px-5 py-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <Fact icon={CalendarDays} label="Date" value={date} wide />
          <Fact icon={Clock} label="Start time" value={booking.event_time} />
          <Fact icon={Timer} label="Expected duration" value={booking.duration} />
          <Fact icon={MapPin} label="Location" value={booking.location} wide />
          <Fact icon={Users} label="People" value={booking.attendees ? String(booking.attendees) : ''} />
          <Fact icon={Wallet} label="Stated budget" value={booking.budget} />
        </div>

        {booking.event_description && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/35">
              Their notes
            </p>
            <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-white/80">
              {booking.event_description}
            </p>
          </div>
        )}
      </div>

      {liveQuote && (
        <div className="glass mt-3 rounded-[26px] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/35">
            Quote sent · waiting on the client
          </p>
          <p className="mt-2 font-display text-[26px] leading-none text-white">{money(liveQuote.amount)}</p>
          <p className="mt-1.5 text-[13px] text-white/50">
            {liveQuote.included_edits} edited photos
            {liveQuote.expires_at ? ` · expires ${format(new Date(liveQuote.expires_at), 'MMM d')}` : ''}
          </p>
          {liveQuote.message && (
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">{liveQuote.message}</p>
          )}
        </div>
      )}

      {!liveQuote && acceptedQuote && (
        <div className="glass mt-3 rounded-[26px] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/35">
            Accepted quote
          </p>
          <p className="mt-2 font-display text-[26px] leading-none text-white">{money(acceptedQuote.amount)}</p>
          {Number(booking.creator_payout) > 0 && (
            <p className="mt-1.5 text-[13px] text-white/50">
              Your payout {money(booking.creator_payout)} ·{' '}
              {booking.payment_status === 'released' ? 'paid out' : 'held until delivery'}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Pill as={Link} to={`/messages/${booking.id}`} tone="glass" className="flex-1 py-4">
          <MessageCircle className="h-4 w-4" /> Message client
        </Pill>
        {canQuote && !liveQuote && (
          <Pill as="button" type="button" tone="lime" onClick={() => setQuoting(true)} className="flex-1 py-4">
            Send a quote
          </Pill>
        )}
      </div>

      <QuoteComposer
        open={quoting}
        onClose={() => setQuoting(false)}
        booking={booking}
        payoutsReady={Boolean(myProfile?.payouts_enabled)}
        onSent={onQuoteSent}
      />
    </div>
  );
}