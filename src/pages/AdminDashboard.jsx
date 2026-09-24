import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Star, Calendar, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import RatingDisplay from '@/components/RatingDisplay';

const SURFACE = { background: 'hsl(var(--surface))', borderRadius: 4 };
const CARD = 'border border-white/10';

function Pill({ children, tone = 'cyan' }) {
  const color = `hsl(var(--neon-${tone}))`;
  return (
    <span
      className="label-mono text-[8px] font-semibold px-2.5 py-1.5"
      style={{ background: `hsl(var(--neon-${tone}) / 0.12)`, color, borderRadius: 3 }}
    >
      {children}
    </span>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: lensmen = [] } = useQuery({
    queryKey: ['admin-lensmen'],
    queryFn: () => base44.entities.Lensman.list('-created_date'),
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const decidePayout = useMutation({
    mutationFn: ({ bookingId, action }) => base44.functions.invoke('releasePayout', { bookingId, action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  const flagged = bookings.filter(b => b.flagged_for_review);
  const approved = lensmen.filter(l => l.status === 'approved');
  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0);

  const stats = [
    { icon: Star, label: 'Active lensmen', value: approved.length, color: 'hsl(var(--neon-lime))' },
    { icon: Calendar, label: 'Total bookings', value: bookings.length, color: 'hsl(var(--neon-magenta))' },
    { icon: DollarSign, label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'hsl(var(--neon-lime))' },
  ];

  return (
    <div className="min-h-screen bg-ink">
      <div className="border-b border-white/10 py-12 px-5 md:px-10">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="label-mono text-[9px] text-white/35 mb-4">Internal</p>
            <h1 className="font-heading text-white font-semibold leading-[0.95] mb-3" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
              Admin
            </h1>
            <p className="font-body text-[13px] text-white/45">Manage lensmen and track bookings.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className={`${CARD} p-5 text-center`} style={SURFACE}>
              <stat.icon className="w-4 h-4 mx-auto mb-3" style={{ color: stat.color }} strokeWidth={1.6} />
              <p className="font-heading text-3xl font-semibold text-white leading-none mb-2">{stat.value}</p>
              <p className="label-mono text-[8px] text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="lensmen">
          <TabsList className="bg-transparent border border-white/10 rounded-none p-1 mb-8 h-auto flex-wrap">
            <TabsTrigger value="lensmen" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              Active lensmen ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="flagged" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-magenta data-[state=active]:text-ink">
              Held funds ({flagged.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lensmen" className="space-y-3">
            {approved.map(l => (
              <div key={l.id} className={`${CARD} p-5 flex items-center justify-between gap-4`} style={SURFACE}>
                <div>
                  <h3 className="font-heading text-[18px] font-semibold text-white leading-tight">{l.display_name || 'Stelli creator'}</h3>
                  <p className="label-mono text-[9px] text-white/40 mt-2">
                    {l.neighborhoods?.join(', ')} · {l.specialties?.slice(0, 2).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <RatingDisplay rating={l.avg_rating} reviewCount={l.review_count} />
                  {l.review_count > 0 && (
                    <span className="label-mono text-[9px] text-white/35">{l.review_count} reviews</span>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-3">
            {loadingBookings ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)
            ) : bookings.length > 0 ? (
              bookings.map(b => (
                <div key={b.id} className={`${CARD} p-5 flex items-center justify-between gap-4`} style={SURFACE}>
                  <div>
                    <h3 className="font-heading text-[18px] font-semibold text-white capitalize leading-tight">
                      {b.event_type?.replace(/_/g, ' ') || 'Booking'}
                    </h3>
                    <p className="label-mono text-[9px] text-white/40 mt-2">
                      {b.client_name} → {b.lensman_name} · {b.event_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-heading text-[18px] font-semibold text-white">${b.total_price || 0}</span>
                    <Pill>{b.status?.replace(/_/g, ' ')}</Pill>
                  </div>
                </div>
              ))
            ) : (
              <p className="font-body text-[13px] text-center py-20 text-white/35">No bookings yet</p>
            )}
          </TabsContent>

          <TabsContent value="flagged" className="space-y-4">
            {flagged.length > 0 ? (
              flagged.map(b => (
                <div key={b.id} className={`${CARD} p-6`} style={SURFACE}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-heading text-[20px] font-semibold text-white leading-tight">
                        {b.client_name} → {b.lensman_name}
                      </h3>
                      <p className="label-mono text-[9px] text-white/40 mt-2">
                        {b.event_date} · held ${Number(b.total_price || 0).toLocaleString()} · creator gets ${Number(b.creator_payout || 0).toLocaleString()}
                      </p>
                    </div>
                    <Pill tone="magenta">{b.payment_status}</Pill>
                  </div>

                  {b.flag_reason && (
                    <p className="font-body text-[13px] leading-relaxed text-white/55 mb-5">{b.flag_reason}</p>
                  )}

                  {b.problem_note && (
                    <p className="font-body text-[13px] leading-relaxed text-white/70 border-l-2 pl-4 mb-5" style={{ borderColor: 'hsl(var(--neon-magenta) / 0.5)' }}>
                      {b.problem_note}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => decidePayout.mutate({ bookingId: b.id, action: 'release' })}
                      disabled={decidePayout.isPending}
                      className="flex-1 label-mono text-[10px] font-semibold"
                      style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
                    >
                      Release to creator
                    </Button>
                    <Button
                      onClick={() => decidePayout.mutate({ bookingId: b.id, action: 'refund' })}
                      disabled={decidePayout.isPending}
                      variant="outline"
                      className="flex-1 label-mono text-[10px] border-white/15 text-white/60 bg-transparent hover:bg-white/5 hover:text-white"
                      style={{ borderRadius: 4 }}
                    >
                      Refund the client
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="font-body text-[13px] text-center py-20 text-white/35">Nothing needs a decision.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}