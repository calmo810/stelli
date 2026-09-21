import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Calendar, Inbox, Link2, UserRound } from 'lucide-react';
import BookingCard from '../components/dashboard/BookingCard';
import QuoteForm from '../components/dashboard/QuoteForm';
import DeliveryForm from '../components/dashboard/DeliveryForm';
import ProfileEditor from '../components/dashboard/ProfileEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import MyAgreements from '@/components/dashboard/MyAgreements';
import { CREATOR_BOOKING_STATUSES } from '@/features/bookings/booking.constants';
import { useCreatorBookings, useCurrentUser } from '@/features/bookings/booking.queries';

export default function LensmanDashboard() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: bookings = [], isLoading } = useCreatorBookings(user?.email);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['lensman-bookings'] });

  const requests = bookings.filter(b => CREATOR_BOOKING_STATUSES.requests.includes(b.status));
  const upcoming = bookings.filter(b => CREATOR_BOOKING_STATUSES.upcoming.includes(b.status));
  const deliveries = bookings.filter(b => CREATOR_BOOKING_STATUSES.deliveries.includes(b.status));
  const completed = bookings.filter(b => CREATOR_BOOKING_STATUSES.completed.includes(b.status));

  return (
    <div className="min-h-screen" style={{ background: '#f0ede6' }}>
      <div className="border-b py-12 px-8 md:px-14" style={{ borderColor: 'rgba(26,39,68,0.1)' }}>
        <div className="max-w-[1180px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.3)' }}>Creator Home Base</p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3" style={{ color: '#1a2744' }}>Creator Dashboard</h1>
            <p className="text-sm" style={{ color: 'rgba(26,39,68,0.45)' }}>Answer requests with a private quote, then deliver the gallery link.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-8 md:px-14 py-8">
        <div className="mb-8">
          <MyAgreements role="lensman" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Inbox, label: 'New Requests', value: requests.length },
            { icon: Calendar, label: 'Upcoming', value: upcoming.length },
            { icon: Link2, label: 'To Deliver', value: deliveries.length },
            { icon: Star, label: 'Completed', value: completed.length },
          ].map((stat, i) => (
            <div key={i} className="border p-4 text-center" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
              <stat.icon className="w-4 h-4 mx-auto mb-2" style={{ color: 'rgba(26,39,68,0.35)' }} />
              <p className="text-2xl font-bold" style={{ color: '#1a2744' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'rgba(26,39,68,0.4)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="border rounded-none p-1 flex-wrap h-auto" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
            <TabsTrigger value="requests" className="rounded-none text-xs">Requests ({requests.length})</TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-none text-xs">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="deliveries" className="rounded-none text-xs">Deliveries ({deliveries.length})</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-none text-xs">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-none text-xs"><UserRound className="w-3.5 h-3.5 mr-1.5" /> Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileEditor />
          </TabsContent>

          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              <TabsContent value="requests" className="space-y-4">
                {requests.length > 0 ? requests.map(b => (
                  <div key={b.id} className="space-y-3">
                    <BookingCard booking={b} role="lensman" />
                    <QuoteForm booking={b} onSent={refresh} />
                  </div>
                )) : (
                  <p className="text-center py-16 text-muted-foreground">No new requests right now.</p>
                )}
              </TabsContent>
              <TabsContent value="upcoming" className="space-y-4">
                {upcoming.length > 0 ? upcoming.map(b => <BookingCard key={b.id} booking={b} role="lensman" />) : (
                  <p className="text-center py-16 text-muted-foreground">No quoted bookings yet.</p>
                )}
              </TabsContent>
              <TabsContent value="deliveries" className="space-y-4">
                {deliveries.length > 0 ? deliveries.map(b => (
                  <div key={b.id} className="space-y-3">
                    <BookingCard booking={b} role="lensman" />
                    <DeliveryForm booking={b} onDelivered={refresh} />
                  </div>
                )) : (
                  <p className="text-center py-16 text-muted-foreground">Nothing waiting on delivery.</p>
                )}
              </TabsContent>
              <TabsContent value="completed" className="space-y-4">
                {completed.length > 0 ? completed.map(b => <BookingCard key={b.id} booking={b} role="lensman" />) : (
                  <p className="text-center py-16 text-muted-foreground">No completed bookings yet.</p>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
