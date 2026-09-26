import React from 'react';
import { CalendarCheck } from 'lucide-react';
import SheetHead from '@/components/dashboard/stack/SheetHead';
import BookingCard from '@/components/dashboard/BookingCard';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import { Skeleton } from '@/components/ui/skeleton';
import useCreatorDashboard from '@/hooks/useCreatorDashboard';

export default function UpcomingSheet() {
  const { upcoming, isLoading } = useCreatorDashboard();

  return (
    <>
      <SheetHead title="Upcoming shoots" subtitle="Quoted and booked dates." />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[22px]" />
          ))}
        </div>
      ) : upcoming.length ? (
        <div className="space-y-3">
          {upcoming.map((booking) => (
            <BookingCard key={booking.id} booking={booking} role="lensman" />
          ))}
        </div>
      ) : (
        <EmptyPanel icon={CalendarCheck} title="Nothing on the books." body="Shoots you have quoted and booked show up here." />
      )}
    </>
  );
}