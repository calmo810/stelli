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
import WorkspaceEmpty from '@/components/creator/workspace/WorkspaceEmpty';
import { money, timeLabel } from '@/lib/format';
import { statusChip } from '@/lib/threadStatus';
import { deadlineFor } from '@/hooks/useCreatorPortal';
import { effectiveStatus, moneyTaken } from '@/lib/bookingNextStep';

function Fact({ icon: Icon, label, value, wide = false }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="wk-label">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">{value || 'Not given'}</p>
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
    return <div className="wk-card h-[320px] animate-pulse" />;
  }

  if (!booking) {
    return (
      <div>
        <Link to="/lensman-dashboard/requests" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fg-3 hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5" /> Requests
        </Link>
        <div className="mt-5">
          <WorkspaceEmpty
            icon={FileText}
            title="Request not found"
            body="This request is no longer available on your profile."
          />
        </div>
      </div>
    );
  }

  const status = effectiveStatus(booking);
  const isNew = status === 'requested';
  const deadline = isNew ? deadlineFor(booking) : null;
  const late = deadline ? deadline.getTime() < Date.now() : false;
  const quotes = quotesFor(booking.id);
  const liveQuote = quotes.find((q) => q.status === 'sent');
  const acceptedQuote = quotes.find((q) => q.status === 'accepted');
  const canQuote = ['requested', 'quoted'].includes(status);

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
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fg-3 hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Requests
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="wk-chip wk-chip--cyan">{statusChip(booking)}</span>
        {deadline && (
          <span
            className="text-[12px] font-semibold"
            style={{ color: late ? '#f0a3c6' : 'var(--fg-3)' }}
          >
            {late ? 'Reply window closed' : `Reply by ${format(deadline, 'MMM d, h:mm a')}`}
          </span>
        )}
      </div>

      <h1 className="wk-h1 mt-2">{booking.client_name || 'Client'}</h1>
      <p className="mt-1 text-[14px] capitalize text-fg-3">{booking.event_type || 'A shoot'}</p>

      <div className="wk-card wk-card--pad mt-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <Fact icon={CalendarDays} label="Date" value={date} wide />
          <Fact icon={Clock} label="Start time" value={timeLabel(booking.event_time)} />
          <Fact icon={Timer} label="Expected duration" value={booking.duration} />
          <Fact icon={MapPin} label="Location" value={booking.location} wide />
          <Fact icon={Users} label="People" value={booking.attendees ? String(booking.attendees) : ''} />
          <Fact icon={Wallet} label="Stated budget" value={booking.budget} />
        </div>

        {booking.event_description && (
          <div className="mt-5 border-t border-[rgba(10,18,38,0.08)] pt-4">
            <p className="wk-label">Their notes</p>
            <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed wk-grey">
              {booking.event_description}
            </p>
          </div>
        )}
      </div>

      {liveQuote && (
        <div className="wk-card wk-card--pad mt-2.5">
          <p className="wk-label">Quote sent · waiting on the client</p>
          <p className="wk-big mt-2 !text-[26px]">{money(liveQuote.amount)}</p>
          <p className="mt-1.5 text-[13px] wk-grey">
            {liveQuote.included_edits} edited photos
            {liveQuote.expires_at ? ` · expires ${format(new Date(liveQuote.expires_at), 'MMM d')}` : ''}
          </p>
          {liveQuote.message && (
            <p className="mt-2 text-[13.5px] leading-relaxed wk-grey">{liveQuote.message}</p>
          )}
        </div>
      )}

      {!liveQuote && acceptedQuote && (
        <div className="wk-card wk-card--pad mt-2.5">
          <p className="wk-label">Accepted quote</p>
          <p className="wk-big mt-2 !text-[26px]">{money(acceptedQuote.amount)}</p>
          {Number(booking.creator_payout) > 0 && (
            <p className="mt-1.5 text-[13px] wk-grey">
              Your payout {money(booking.creator_payout)} ·{' '}
              {booking.payment_status === 'released'
                ? 'paid out'
                : moneyTaken(booking)
                  ? 'held until delivery'
                  : 'once the client pays'}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/messages/${booking.id}`} className="wk-btn wk-btn--ghost flex-1">
          <MessageCircle className="h-4 w-4" /> Message client
        </Link>
        {canQuote && !liveQuote && (
          <button type="button" onClick={() => setQuoting(true)} className="wk-btn wk-btn--lime flex-1">
            Send a quote
          </button>
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