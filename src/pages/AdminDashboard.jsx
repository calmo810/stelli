import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, Users, Calendar, DollarSign, Check, X, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

function ApplicationCard({ lensman, onApprove, onReject }) {
  const [notes, setNotes] = React.useState('');

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold">{lensman.full_name}</h3>
          <p className="text-xs text-muted-foreground">{lensman.email} · {lensman.neighborhoods?.join(', ')}</p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">Pending Review</Badge>
      </div>

      {lensman.bio && <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lensman.bio}</p>}

      {lensman.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {lensman.specialties.map((s, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] rounded-full">{s}</Badge>
          ))}
        </div>
      )}

      {/* Portfolio Preview */}
      {lensman.portfolio_images?.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 mb-4 rounded-xl overflow-hidden">
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

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span>{lensman.years_experience || 0} years experience</span>
        <span>{lensman.portfolio_images?.length || 0} photos</span>
      </div>

      <div className="mb-4">
        <Textarea
          placeholder="Internal notes (optional)..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="rounded-xl text-sm min-h-[60px]"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onApprove(lensman, notes)} className="rounded-full bg-green-600 hover:bg-green-700 text-white flex-1">
          <Check className="w-4 h-4 mr-1.5" /> Approve
        </Button>
        <Button onClick={() => onReject(lensman, notes)} variant="outline" className="rounded-full flex-1">
          <X className="w-4 h-4 mr-1.5" /> Reject
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

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-background border-b border-border py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Review applications, manage lensmen, track bookings.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Pending Review', value: pending.length, color: 'text-amber-600' },
            { icon: Star, label: 'Active Lensmen', value: approved.length, color: 'text-green-600' },
            { icon: Calendar, label: 'Total Bookings', value: bookings.length, color: 'text-blue-600' },
            { icon: DollarSign, label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'text-foreground' },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center">
              <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="bg-card border border-border rounded-full p-1 mb-6">
            <TabsTrigger value="applications" className="rounded-full text-xs">
              Applications ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="lensmen" className="rounded-full text-xs">
              Active Lensmen ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-full text-xs">
              Bookings ({bookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            {loadingLensmen ? (
              Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
            ) : pending.length > 0 ? (
              pending.map(l => <ApplicationCard key={l.id} lensman={l} onApprove={handleApprove} onReject={handleReject} />)
            ) : (
              <p className="text-center py-16 text-muted-foreground">No pending applications</p>
            )}
          </TabsContent>

          <TabsContent value="lensmen" className="space-y-3">
            {approved.map(l => (
              <div key={l.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{l.full_name}</h3>
                  <p className="text-xs text-muted-foreground">{l.neighborhoods?.join(', ')} · {l.specialties?.slice(0, 2).join(', ')}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-gold fill-gold" /> {l.avg_rating?.toFixed(1) || '5.0'}
                  </span>
                  <span className="text-muted-foreground">{l.review_count || 0} reviews</span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-3">
            {loadingBookings ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
            ) : bookings.length > 0 ? (
              bookings.map(b => (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm capitalize">{b.event_type?.replace(/_/g, ' ')}</h3>
                    <p className="text-xs text-muted-foreground">{b.client_name} → {b.lensman_name} · {b.event_date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">${b.total_price || 0}</span>
                    <Badge className="text-[10px] capitalize">{b.status?.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-16 text-muted-foreground">No bookings yet</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}