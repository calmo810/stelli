import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Calendar, Clock } from 'lucide-react';
import BookingCard from '../components/dashboard/BookingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ClientDashboard() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['client-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const upcoming = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status));
  const awaiting = bookings.filter(b => b.status === 'awaiting_delivery');
  const past = bookings.filter(b => ['delivered', 'completed'].includes(b.status));

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-background border-b border-border py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Your Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your bookings, messages, and deliveries.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Calendar, label: 'Upcoming', value: upcoming.length },
            { icon: Clock, label: 'Awaiting Delivery', value: awaiting.length },
            { icon: Star, label: 'Completed', value: past.length },
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
            <TabsTrigger value="past" className="rounded-full text-xs">Past ({past.length})</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="space-y-4">
                {upcoming.length > 0 ? upcoming.map(b => <BookingCard key={b.id} booking={b} role="client" />) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground mb-4">No upcoming bookings</p>
                    <Link to="/browse"><Button className="rounded-full bg-foreground text-background">Browse Lensmen</Button></Link>
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
                    {b.delivered_files?.length > 0 && (
                      <div className="absolute top-4 right-4">
                        <Link to={`/album/${b.id}`}>
                          <Button size="sm" className="rounded-full bg-foreground text-background text-xs">View Album</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-center py-16 text-muted-foreground">No past bookings yet</p>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}