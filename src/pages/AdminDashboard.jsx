import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Users, Calendar, DollarSign, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

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

function ApplicationCard({ lensman, onApprove, onReject }) {
  const [notes, setNotes] = useState('');

  return (
    <div className={`${CARD} p-6`} style={SURFACE}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-heading text-[22px] font-semibold text-white leading-tight">{lensman.full_name}</h3>
          <p className="label-mono text-[9px] text-white/40 mt-2">
            {lensman.email} · {lensman.neighborhoods?.join(', ')}
          </p>
        </div>
        <Pill>Pending review</Pill>
      </div>

      {lensman.bio && (
        <p className="font-body text-[13px] leading-relaxed text-white/50 mb-4">{lensman.bio}</p>
      )}

      {lensman.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {lensman.specialties.map((s, i) => (
            <span key={i} className="label-mono text-[9px] px-2.5 py-1.5 border border-white/10 text-white/50" style={{ borderRadius: 3 }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {lensman.portfolio_images?.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 mb-4 overflow-hidden" style={{ borderRadius: 4 }}>
          {lensman.portfolio_images.slice(0, 4).map((img, i) => (
            <Dialog key={i}>
              <DialogTrigger asChild>
                <div className="aspect-square cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-0 bg-black border-none">
                <img src={img} alt="" className="w-full max-h-[80vh] object-contain" />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}

      <div className="flex items-center gap-5 label-mono text-[9px] text-white/35 mb-4">
        <span>{lensman.years_experience || 0} years experience</span>
        <span>{lensman.portfolio_images?.length || 0} photos</span>
      </div>

      <Textarea
        placeholder="Internal notes (optional)..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="rounded-none bg-transparent border-white/10 text-white text-sm min-h-[60px] mb-4 placeholder:text-white/25"
      />

      <div className="flex gap-2">
        <Button
          onClick={() => onApprove(lensman, notes)}
          className="flex-1 label-mono text-[10px] font-semibold hover:opacity-90"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
        >
          <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
        </Button>
        <Button
          onClick={() => onReject(lensman, notes)}
          variant="outline"
          className="flex-1 label-mono text-[10px] border-white/15 text-white/60 bg-transparent hover:bg-white/5 hover:text-white"
          style={{ borderRadius: 4 }}
        >
          <X className="w-3.5 h-3.5 mr-1.5" /> Reject
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: lensmen = [], isLoading: loadingLensmen } = useQuery({
    queryKey: ['admin-lensmen'],
    queryFn: () => base44.entities.Lensman.list('-created_date'),
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const updateLensman = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lensman.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-lensmen'] }),
  });

  const handleApprove = (lensman, notes) => {
    updateLensman.mutate({ id: lensman.id, data: { status: 'approved', admin_notes: notes } });
  };

  const handleReject = (lensman, notes) => {
    updateLensman.mutate({ id: lensman.id, data: { status: 'rejected', admin_notes: notes } });
  };

  const pending = lensmen.filter(l => l.status === 'pending');
  const approved = lensmen.filter(l => l.status === 'approved');
  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0);

  const stats = [
    { icon: Users, label: 'Pending review', value: pending.length, color: 'hsl(var(--neon-cyan))' },
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
            <p className="font-body text-[13px] text-white/45">Review applications, manage lensmen, track bookings.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className={`${CARD} p-5 text-center`} style={SURFACE}>
              <stat.icon className="w-4 h-4 mx-auto mb-3" style={{ color: stat.color }} strokeWidth={1.6} />
              <p className="font-heading text-3xl font-semibold text-white leading-none mb-2">{stat.value}</p>
              <p className="label-mono text-[8px] text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="bg-transparent border border-white/10 rounded-none p-1 mb-8 h-auto flex-wrap">
            <TabsTrigger value="applications" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              Applications ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="lensmen" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              Active lensmen ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              Bookings ({bookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            {loadingLensmen ? (
              Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)
            ) : pending.length > 0 ? (
              pending.map(l => <ApplicationCard key={l.id} lensman={l} onApprove={handleApprove} onReject={handleReject} />)
            ) : (
              <p className="font-body text-[13px] text-center py-20 text-white/35">No pending applications</p>
            )}
          </TabsContent>

          <TabsContent value="lensmen" className="space-y-3">
            {approved.map(l => (
              <div key={l.id} className={`${CARD} p-5 flex items-center justify-between gap-4`} style={SURFACE}>
                <div>
                  <h3 className="font-heading text-[18px] font-semibold text-white leading-tight">{l.full_name}</h3>
                  <p className="label-mono text-[9px] text-white/40 mt-2">
                    {l.neighborhoods?.join(', ')} · {l.specialties?.slice(0, 2).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" style={{ color: 'hsl(var(--neon-magenta))' }} fill="hsl(var(--neon-magenta))" />
                    <span className="font-body text-[12px] text-white/75">{l.avg_rating?.toFixed(1) || '5.0'}</span>
                  </span>
                  <span className="label-mono text-[9px] text-white/35">{l.review_count || 0} reviews</span>
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
                      {b.event_type?.replace(/_/g, ' ')}
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
        </Tabs>
      </div>
    </div>
  );
}