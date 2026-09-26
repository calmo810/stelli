import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Sparkles, Images } from 'lucide-react';
import SheetHead from '@/components/dashboard/stack/SheetHead';
import BookingCard from '@/components/dashboard/BookingCard';
import QuotePanel from '@/components/dashboard/QuotePanel';
import SegmentedTabs from '@/components/dashboard/SegmentedTabs';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import Pill from '@/components/shared/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import useClientDashboard from '@/hooks/useClientDashboard';

const TABS = ['upcoming', 'awaiting', 'past'];

export default function BookingsSheet() {
  const { upcoming, awaiting, past, quoteFor, isLoading, refresh } = useClientDashboard();
  const [tab, setTab] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab');
    return TABS.includes(wanted) ? wanted : 'upcoming';
  });

  const panels = {
    upcoming: upcoming.length ? (
      upcoming.map((booking) => (
        <div key={booking.id} className="space-y-3">
          <BookingCard booking={booking} role="client" />
          {quoteFor(booking.id) && (
            <QuotePanel quote={quoteFor(booking.id)} booking={booking} onAccepted={refresh} />
          )}
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
      awaiting.map((booking) => <BookingCard key={booking.id} booking={booking} role="client" />)
    ) : (
      <EmptyPanel icon={Images} title="Nothing in the darkroom." body="Shoots waiting on delivery show up here." />
    ),
    past: past.length ? (
      past.map((booking) => (
        <div key={booking.id} className="space-y-3">
          <BookingCard booking={booking} role="client" />
          {booking.delivery_link && (
            <div className="flex justify-end">
              <Link to={`/album/${booking.id}`}>
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
    <>
      <SheetHead title="Bookings" subtitle="Your shoots, quotes and galleries." />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { value: 'awaiting', label: 'Awaiting', count: awaiting.length },
          { value: 'past', label: 'Delivered', count: past.length },
        ]}
      />

      {isLoading ? (
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[22px]" />
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-3">{panels[tab]}</div>
      )}
    </>
  );
}