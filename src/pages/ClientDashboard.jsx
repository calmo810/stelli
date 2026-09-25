import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Sparkles, Images } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookingCard from '@/components/dashboard/BookingCard';
import QuotePanel from '@/components/dashboard/QuotePanel';
import MyAgreements from '@/components/dashboard/MyAgreements';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SegmentedTabs from '@/components/dashboard/SegmentedTabs';
import NeedsYou from '@/components/dashboard/NeedsYou';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import GlassRows from '@/components/shared/GlassRows';
import Pill from '@/components/shared/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import shortDate from '@/lib/shortDate';

const UPCOMING = ['requested', 'quoted', 'quote_accepted', 'confirmed', 'in_progress'];
const AWAITING = ['awaiting_delivery'];
const PAST = ['delivered', 'completed'];

export default function ClientDashboard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('upcoming');
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['client-bookings', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email }, '-created_date'),
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['client-quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date'),
  });

  const quoteFor = (bookingId) => quotes.find((q) => q.booking_id === bookingId && q.status === 'sent');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['client-quotes'] });
  };

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

  const upcoming = bookings.filter((b) => UPCOMING.includes(b.status));
  const awaiting = bookings.filter((b) => AWAITING.includes(b.status));
  const past = bookings.filter((b) => PAST.includes(b.status));

  const needs = [
    ...bookings
      .filter((b) => quoteFor(b.id))
      .map((b) => ({
        id: `quote-${b.id}`,
        title: `${b.lensman_name || 'Your creator'} sent a quote`,
        meta: [shortDate(b.event_date), b.location].filter(Boolean).join(' · '),
        action: 'Review',
        to: `/messages/${b.id}`,
      })),
    ...awaiting.map((b) => ({
      id: `ready-${b.id}`,
      title: `${b.lensman_name || 'Your creator'} delivered your photos`,
      meta: `Shot ${shortDate(b.event_date)}`,
      action: 'View',
      to: `/album/${b.id}`,
    })),
  ];

  const tabs = [
    { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { value: 'awaiting', label: 'Awaiting', count: awaiting.length },
    { value: 'past', label: 'Delivered', count: past.length },
  ];

  const panels = {
    upcoming: upcoming.length ? (
      upcoming.map((b) => (
        <div key={b.id} className="space-y-3">
          <BookingCard booking={b} role="client" />
          {quoteFor(b.id) && <QuotePanel quote={quoteFor(b.id)} booking={b} onAccepted={refresh} />}
        </div>
      ))
    ) : (
      <EmptyPanel
        icon={CalendarCheck}
        title="No shoots booked."
        body="Find a creator and send your first request."
        cta={
          <Link to="/creators">
            <Pill>Browse creators</Pill>
          </Link>
        }
      />
    ),
    awaiting: awaiting.length ? (
      awaiting.map((b) => <BookingCard key={b.id} booking={b} role="client" />)
    ) : (
      <EmptyPanel icon={Images} title="Nothing in the darkroom." body="Shoots waiting on delivery show up here." />
    ),
    past: past.length ? (
      past.map((b) => (
        <div key={b.id} className="space-y-3">
          <BookingCard booking={b} role="client" />
          {b.delivery_link && (
            <div className="flex justify-end">
              <Link to={`/album/${b.id}`}>
                <Pill tone="glass">Memory album</Pill>
              </Link>
            </div>
          )}
        </div>
      ))
    ) : (
      <EmptyPanel icon={Sparkles} title="No photos yet." body="Delivered galleries collect here." />
    ),
  };

  return (
    <DashboardShell>
      <h1
        className="font-display font-medium text-white"
        style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1.05 }}
      >
        Hey, {firstName}.
      </h1>
      <p className="mt-1.5 text-[16px] text-white/60">Your shoots, quotes and galleries in one place.</p>

      <h3 className="mb-2.5 mt-8 pl-1.5 text-[13px] font-semibold text-white/50">Needs you</h3>
      <NeedsYou
        items={needs}
        empty={{
          icon: Sparkles,
          title: "You're all caught up.",
          body: 'Book your next shoot and it will show up here.',
          cta: (
            <Link to="/creators">
              <Pill>Browse creators</Pill>
            </Link>
          ),
        }}
      />

      <SegmentedTabs className="mt-8" value={tab} onChange={setTab} options={tabs} />

      {isLoading ? (
        <div className="mt-3 space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[22px]" />
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-3">{panels[tab]}</div>
      )}

      <div className="mt-8">
        <MyAgreements role="client" />
      </div>

      <GlassRows
        className="mt-8"
        rows={[
          { label: 'Find a creator', to: '/creators' },
          { label: 'Messages', to: '/portal/messages' },
          { label: 'Account', to: '/account-settings' },
        ]}
      />
    </DashboardShell>
  );
}