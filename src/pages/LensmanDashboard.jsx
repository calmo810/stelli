import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import BookingCard from '../components/dashboard/BookingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function LensmanDashboard() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lensman-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const upcoming = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status));
  const needsDelivery = bookings.filter(b => b.status === 'awaiting_delivery');
  const completed = bookings.filter(b => ['delivered', 'completed'].includes(b.status));
  const totalEarned = completed.reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-background border-b border-border py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Creator Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your bookings, deliveries, and earnings.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Calendar, label: 'Upcoming', value: upcoming.length },
            { icon: TrendingUp, label: 'Needs Delivery', value: needsDelivery.length },
            { icon: Star, label: 'Completed', value: completed.length },
            { icon: DollarSign, label: 'Total Earned', value: `$${totalEarned.toLocaleString()}` },
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
            <TabsTrigger value="delivery" className="rounded-full text-xs">Needs Delivery ({needsDelivery.length})</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full text-xs">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="space-y-4">
                {upcoming.length > 0 ? upcoming.map(b => <BookingCard key={b.id} booking={b} role="lensman" />) : (
                  <p className="text-center py-16 text-muted-foreground">No upcoming bookings yet. Hang tight — clients are discovering your profile!</p>
                )}
              </TabsContent>
              <TabsContent value="delivery" className="space-y-4">
                {needsDelivery.length > 0 ? needsDelivery.map(b => <BookingCard key={b.id} booking={b} role="lensman" />) : (
                  <p className="text-center py-16 text-muted-foreground">No pending deliveries</p>
                )}
              </TabsContent>
              <TabsContent value="completed" className="space-y-4">
                {completed.length > 0 ? completed.map(b => <BookingCard key={b.id} booking={b} role="lensman" />) : (
                  <p className="text-center py-16 text-muted-foreground">No completed bookings yet</p>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}