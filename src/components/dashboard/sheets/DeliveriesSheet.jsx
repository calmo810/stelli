import React from 'react';
import { Link2 } from 'lucide-react';
import SheetHead from '@/components/dashboard/stack/SheetHead';
import BookingCard from '@/components/dashboard/BookingCard';
import DeliveryForm from '@/components/dashboard/DeliveryForm';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import { Skeleton } from '@/components/ui/skeleton';
import useCreatorDashboard from '@/hooks/useCreatorDashboard';

export default function DeliveriesSheet() {
  const { deliveries, isLoading, refresh } = useCreatorDashboard();

  return (
    <>
      <SheetHead title="Deliveries" subtitle="Galleries waiting on your link." />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[22px]" />
          ))}
        </div>
      ) : deliveries.length ? (
        <div className="space-y-3">
          {deliveries.map((booking) => (
            <div key={booking.id} className="space-y-3">
              <BookingCard booking={booking} role="lensman" />
              <DeliveryForm booking={booking} onDelivered={refresh} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel icon={Link2} title="No galleries due." body="Shoots waiting on your delivery link live here." />
      )}
    </>
  );
}