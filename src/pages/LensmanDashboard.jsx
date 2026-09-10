import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Calendar, DollarSign, TrendingUp, UserRound } from 'lucide-react';
import BookingCard from '../components/dashboard/BookingCard';
import ProfileEditor from '../components/dashboard/ProfileEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import MyAgreements from '@/components/dashboard/MyAgreements';

export default function LensmanDashboard() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lensman-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const upcoming = bookings.filter(b => ['pending', 'awaiting_creator_acceptance', 'confirmed', 'in_progress'].includes(b.status));
  const needsDelivery = bookings.filter(b => b.status === 'awaiting_delivery');
  const completed = bookings.filter(b => ['delivered', 'completed'].includes(b.status));
  const totalEarned = completed.reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: '#f0ede6' }}>
      <div className="border-b py-12 px-8 md:px-14" style={{ borderColor: 'rgba(26,39,68,0.1)' }}>
        <div className="max-w-[1180px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.3)' }}>Creator Home Base</p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3" style={{ color: '#1a2744' }}>Creator Dashboard</h1>
            <p className="text-sm" style={{ color: 'rgba(26,39,68,0.45)' }}>Manage your bookings and customize the profile link you put in your bio.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-8 md:px-14 py-8">
        <div className="mb-8">
          <MyAgreements role="lensman" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Calendar, label: 'Upcoming', value: upcoming.length },
            { icon: TrendingUp, label: 'Needs Delivery', value: needsDelivery.length },
            { icon: Star, label: 'Completed', value: completed.length },
            { icon: DollarSign, label: 'Total Earned', value: `$${totalEarned.toLocaleString()}` },
          ].map((stat, i) => (
            <div key={i} className="border p-4 text-center" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
              <stat.icon className="w-4 h-4 mx-auto mb-2" style={{ color: 'rgba(26,39,68,0.35)' }} />
              <p className="text-2xl font-bold" style={{ color: '#1a2744' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'rgba(26,39,68,0.4)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="border rounded-none p-1" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
            <TabsTrigger value="profile" className="rounded-none text-xs"><UserRound className="w-3.5 h-3.5 mr-1.5" /> Profile</TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-none text-xs">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="delivery" className="rounded-none text-xs">Needs Delivery ({needsDelivery.length})</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-none text-xs">Completed ({completed.length})</TabsTrigger>
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