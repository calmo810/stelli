import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import SheetHead from '@/components/dashboard/stack/SheetHead';
import BookingCard from '@/components/dashboard/BookingCard';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import Pill from '@/components/shared/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import useCreatorDashboard from '@/hooks/useCreatorDashboard';

export default function RequestsSheet() {
  const { requests, isLoading } = useCreatorDashboard();

  return (
    <>
      <SheetHead title="Requests" subtitle="Send a quote to lock the date." />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[22px]" />
          ))}
        </div>
      ) : requests.length ? (
        <div className="space-y-3">
          {requests.map((booking) => (
            <div key={booking.id} className="space-y-3">
              <BookingCard booking={booking} role="lensman" />
              <div className="flex justify-end">
                <Link to={`/messages/${booking.id}`}>
                  <Pill>Quote</Pill>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel icon={Inbox} title="No requests yet." body="When someone asks you to shoot, it lands here." />
      )}
    </>
  );
}