import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Calendar, Clock } from 'lucide-react';
import BookingCard from '../components/dashboard/BookingCard';
import QuotePanel from '../components/dashboard/QuotePanel';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MyAgreements from '@/components/dashboard/MyAgreements';
import { CLIENT_BOOKING_STATUSES } from '@/features/bookings/booking.constants';
import { useClientBookings, useCurrentUser, useQuotes } from '@/features/bookings/booking.queries';

export default function ClientDashboard() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: bookings = [], isLoading } = useClientBookings(user?.email);
  const { data: quotes = [] } = useQuotes();

  const quoteFor = (bookingId) =>
    quotes.find(q => q.booking_id === bookingId && q.status === 'sent');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['client-quotes'] });
  };

  const upcoming = bookings.filter(b => CLIENT_BOOKING_STATUSES.upcoming.includes(b.status));
  const awaiting = bookings.filter(b => CLIENT_BOOKING_STATUSES.awaitingDelivery.includes(b.status));
  const past = bookings.filter(b => CLIENT_BOOKING_STATUSES.past.includes(b.status));
  const openQuotes = bookings.filter(b => quoteFor(b.id)).length;

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-background border-b border-border py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Your Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your requests, quotes, and deliveries.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <MyAgreements role="client" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Calendar, label: 'Upcoming', value: upcoming.length },
            { icon: Clock, label: 'Quotes to review', value: openQuotes },
            { icon: Star, label: 'Delivered', value: past.length },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center">
              <stat.icon className="w-4 h-4 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="bg-card border border-border rounded-full p-1">
            <TabsTrigger value="upcoming" className="rounded-full text-xs">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="awaiting" className="rounded-full text-xs">Awaiting ({awaiting.length})</TabsTrigger>
            <TabsTrigger value="past" className="rounded-full text-xs">Delivered ({past.length})</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="space-y-4">
                {upcoming.length > 0 ? upcoming.map(b => (
                  <div key={b.id} className="space-y-3">
                    <BookingCard booking={b} role="client" />
                    {quoteFor(b.id) && (
                      <QuotePanel quote={quoteFor(b.id)} booking={b} onAccepted={refresh} />
                    )}
                  </div>
                )) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground mb-4">No requests yet</p>
                    <Link to="/creators"><Button className="rounded-full bg-foreground text-background">Browse creators</Button></Link>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="awaiting" className="space-y-4">
                {awaiting.length > 0 ? awaiting.map(b => <BookingCard key={b.id} booking={b} role="client" />) : (
                  <p className="text-center py-16 text-muted-foreground">No deliveries pending</p>
                )}
              </TabsContent>
              <TabsContent value="past" className="space-y-4">
                {past.length > 0 ? past.map(b => (
                  <div key={b.id} className="relative">
                    <BookingCard booking={b} role="client" />
                    {b.delivery_link && (
                      <div className="absolute top-4 right-4">
                        <Link to={`/album/${b.id}`}>
                          <Button size="sm" className="rounded-full bg-foreground text-background text-xs">Memory album</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-center py-16 text-muted-foreground">Nothing delivered yet</p>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
