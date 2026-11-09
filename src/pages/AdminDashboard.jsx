import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Star, Calendar, DollarSign, ClipboardCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import RatingDisplay from '@/components/RatingDisplay';
import { PayCreatorPanel, OneOffChargePanel } from '@/components/admin/FounderPayments';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminApplications from '@/components/admin/AdminApplications';
import AdminFaqQuestions from '@/components/admin/AdminFaqQuestions';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [creatorSearch, setCreatorSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('all');

  const { data: lensmen = [], isLoading: loadingLensmen, isError: lensmenError } = useQuery({
    queryKey: ['admin-lensmen'],
    queryFn: () => base44.entities.Lensman.list('-created_date'),
  });

  const { data: creatorContacts = [], isLoading: loadingContacts, isError: contactsError } = useQuery({
    queryKey: ['admin-creator-contacts'],
    queryFn: () => base44.entities.CreatorContact.list('-created_date', 500),
  });

  const { data: bookings = [], isLoading: loadingBookings, isError: bookingsError } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const reviewApplication = useMutation({
    mutationFn: ({ lensmanId, status }) => base44.entities.Lensman.update(lensmanId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-lensmen'] }),
  });

  const decidePayout = useMutation({
    mutationFn: ({ bookingId, action }) => base44.functions.invoke('releasePayout', { bookingId, action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  // One combined queue: anything a founder has to look at, plus money sitting on
  // Stelli's balance because the creator has no payout account yet.
  const needsDecision = (booking) =>
    booking.flagged_for_review || booking.dispute_status ? 0 : 1;
  const heldFunds = bookings
    .filter(
      (b) =>
        b.flagged_for_review ||
        Boolean(b.dispute_status) ||
        (['held', 'partially_refunded'].includes(b.payment_status) && b.needs_payout_setup)
    )
    .sort((a, b) => needsDecision(a) - needsDecision(b));
  const approved = lensmen.filter(l => l.status === 'approved');
  const pendingApplications = lensmen.filter((lensman) => lensman.status === 'pending');
  const filteredCreators = useMemo(() => {
    const term = creatorSearch.trim().toLowerCase();
    return approved.filter((lensman) =>
      !term || [lensman.display_name, ...(lensman.neighborhoods || []), ...(lensman.specialties || [])]
        .some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [approved, creatorSearch]);
  const bookingStatuses = [...new Set(bookings.map((booking) => booking.status).filter(Boolean))];
  const filteredBookings = useMemo(() => {
    const term = bookingSearch.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = bookingStatus === 'all' || booking.status === bookingStatus;
      const matchesSearch = !term || [booking.client_name, booking.lensman_name, booking.event_type, booking.event_date]
        .some((value) => String(value || '').toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [bookings, bookingSearch, bookingStatus]);
  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0);

  const stats = [
    { icon: Star, label: 'Active lensmen', value: approved.length, color: 'hsl(var(--neon-lime))' },
    { icon: Calendar, label: 'Total bookings', value: bookings.length, color: 'hsl(var(--neon-magenta))' },
    { icon: DollarSign, label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'hsl(var(--neon-lime))' },
    { icon: ClipboardCheck, label: 'Applications to review', value: loadingLensmen ? '—' : pendingApplications.length, color: 'hsl(var(--neon-cyan))' },
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
            <p className="font-body text-[13px] text-white/45">Review creator applications, monitor bookings, and keep operations moving.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className={`${CARD} p-5 text-center`} style={SURFACE}>
              <stat.icon className="w-4 h-4 mx-auto mb-3" style={{ color: stat.color }} strokeWidth={1.6} />
              <p className="font-heading text-3xl font-semibold text-white leading-none mb-2">{stat.value}</p>
              <p className="label-mono text-[8px] text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border border-white/10 rounded-none p-1 mb-8 h-auto flex-wrap">
            <TabsTrigger value="overview" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-cyan data-[state=active]:text-ink">
              Applications ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="lensmen" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              Active lensmen ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="flagged" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-magenta data-[state=active]:text-ink">
              Held funds ({heldFunds.length})
            </TabsTrigger>
            <TabsTrigger value="pay" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              Pay creators
            </TabsTrigger>
            <TabsTrigger value="charge" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-lime data-[state=active]:text-ink">
              One-off payments
            </TabsTrigger>
            <TabsTrigger value="faq" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-cyan data-[state=active]:text-ink">
              FAQ chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview
              activeCreators={approved.length}
              pendingCount={pendingApplications.length}
              bookingCount={bookings.length}
              heldCount={heldFunds.length}
              bookings={bookings}
              isLoading={loadingBookings}
              onOpenTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="applications">
            <AdminApplications
              applications={pendingApplications}
              contacts={creatorContacts}
              isLoading={loadingLensmen || loadingContacts}
              isError={lensmenError || contactsError}
              isSaving={reviewApplication.isPending}
              savingId={reviewApplication.variables?.lensmanId}
              saveError={reviewApplication.isError}
              onDecision={(application, status) => reviewApplication.mutate({ lensmanId: application.id, status })}
            />
          </TabsContent>

          <TabsContent value="pay">
            <PayCreatorPanel lensmen={lensmen} />
          </TabsContent>

          <TabsContent value="charge">
            <OneOffChargePanel />
          </TabsContent>

          <TabsContent value="faq">
            <AdminFaqQuestions />
          </TabsContent>

          <TabsContent value="lensmen" className="space-y-3">
            <label className="relative block w-full sm:max-w-[360px]">
              <span className="sr-only">Search active creators</span>
              <input
                type="search"
                value={creatorSearch}
                onChange={(event) => setCreatorSearch(event.target.value)}
                placeholder="Search name, specialty, or area…"
                className="w-full rounded border border-white/15 bg-white/[0.03] px-4 py-3 text-[13px] text-white placeholder:text-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-lime"
              />
            </label>
            {lensmenError ? (
              <p role="alert" className="border border-neon-magenta/30 p-4 text-[13px] text-white/70">Creator profiles could not be loaded. Refresh the page and try again.</p>
            ) : loadingLensmen ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)
            ) : filteredCreators.length ? filteredCreators.map(l => (
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
            )) : (
              <p className="font-body text-[13px] text-center py-16 text-white/40">
                {approved.length ? 'No creators match that search.' : 'No approved creators yet.'}
              </p>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block min-w-0 flex-1">
                <span className="sr-only">Search bookings</span>
                <input
                  type="search"
                  value={bookingSearch}
                  onChange={(event) => setBookingSearch(event.target.value)}
                  placeholder="Search client, creator, event, or date…"
                  className="w-full rounded border border-white/15 bg-white/[0.03] px-4 py-3 text-[13px] text-white placeholder:text-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-lime"
                />
              </label>
              <label className="block sm:w-[220px]">
                <span className="sr-only">Filter bookings by status</span>
                <select
                  value={bookingStatus}
                  onChange={(event) => setBookingStatus(event.target.value)}
                  className="w-full rounded border border-white/15 bg-surface px-4 py-3 text-[13px] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-lime"
                >
                  <option value="all">All statuses</option>
                  {bookingStatuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
                </select>
              </label>
            </div>
            {bookingsError ? (
              <p role="alert" className="border border-neon-magenta/30 p-4 text-[13px] text-white/70">Bookings could not be loaded. Refresh the page and try again.</p>
            ) : loadingBookings ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map(b => (
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
              <p className="font-body text-[13px] text-center py-20 text-white/35">
                {bookings.length ? 'No bookings match those filters.' : 'No bookings yet.'}
              </p>
            )}
          </TabsContent>

          <TabsContent value="flagged" className="space-y-4">
            {heldFunds.length > 0 ? (
              heldFunds.map(b => (
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
                    <div className="flex items-center gap-2 shrink-0">
                      <Pill tone="magenta">{b.payment_status}</Pill>
                      {b.dispute_status && <Pill tone="cyan">{b.dispute_status}</Pill>}
                    </div>
                  </div>

                  {b.flag_reason && (
                    <p className="font-body text-[13px] leading-relaxed text-white/55 mb-5">{b.flag_reason}</p>
                  )}

                  {b.problem_note && (
                    <p className="font-body text-[13px] leading-relaxed text-white/70 border-l-2 pl-4 mb-5" style={{ borderColor: 'hsl(var(--neon-magenta) / 0.5)' }}>
                      {b.problem_note}
                    </p>
                  )}

                  {b.flagged_for_review ? (
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
                  ) : (
                    <p className="label-mono text-[9px] text-white/35">
                      {b.dispute_status
                        ? 'Respond in Stripe before the deadline.'
                        : 'Waiting on the creator to finish payout setup.'}
                    </p>
                  )}
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