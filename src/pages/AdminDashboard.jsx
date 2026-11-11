import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Calendar, CircleDollarSign, ClipboardCheck, DollarSign, History, LayoutDashboard, MessageCircle, Sparkles, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import RatingDisplay from '@/components/RatingDisplay';
import { PayCreatorPanel, OneOffChargePanel } from '@/components/admin/FounderPayments';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminApplications from '@/components/admin/AdminApplications';
import AdminFaqQuestions from '@/components/admin/AdminFaqQuestions';
import FounderQueueList from '@/components/admin/FounderQueueList';
import AdminActivity from '@/components/admin/AdminActivity';
import DataFixCard from '@/components/admin/DataFixCard';
import CreatorHoldButton from '@/components/admin/CreatorHoldButton';
import { founderQueue } from '@/lib/founderQueue';

const SURFACE = {
  background: 'linear-gradient(145deg, hsl(var(--surface-2) / .86), hsl(var(--surface) / .94))',
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 18px 42px -30px rgba(0,0,0,.78)',
};
const CARD = 'admin-surface';

function Pill({ children, tone = 'cyan' }) {
  const color = `hsl(var(--neon-${tone}))`;
  return (
    <span
      className="label-mono inline-flex rounded-full px-2.5 py-1.5 text-[8px] font-semibold"
      style={{ background: `hsl(var(--neon-${tone}) / 0.12)`, color }}
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

  // Unmatched payments, one record each: a booking can have several, and the
  // queue gives each its own refund button.
  const { data: strays = null } = useQuery({
    queryKey: ['admin-stray-payments'],
    queryFn: () => base44.entities.StrayPayment.list('-received_at', 500).catch(() => null),
  });

  // Approve / reject goes through the server, which checks the admin role,
  // emails the creator once and writes the decision to the activity log.
  const reviewApplication = useMutation({
    mutationFn: async ({ lensmanId, status }) => {
      const response = await base44.functions.invoke('reviewCreatorApplication', { lensmanId, decision: status });
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lensmen'] });
      queryClient.invalidateQueries({ queryKey: ['admin-creator-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
  });

  // One combined queue: everything waiting on a founder, most urgent first.
  const heldFunds = useMemo(() => founderQueue(bookings, Date.now(), strays), [bookings, strays]);
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
  // Stelli's fees on bookings that have paid out: what the client was charged
  // (less tax and refunds) minus what the creator kept. Not the booking volume.
  const feesEarned = bookings
    .filter((b) => b.payment_status === 'released')
    .reduce(
      (sum, b) =>
        sum +
        (Number(b.amount_charged || 0) - Number(b.tax_amount || 0) - Number(b.refund_amount || 0)) -
        (Number(b.creator_payout || 0) - Number(b.reversal_amount_done || 0)),
      0
    );
  const feesEarnedLabel = Math.max(0, feesEarned).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const stats = [
    { icon: Users, label: 'Active creators', value: approved.length, color: 'hsl(var(--neon-lime))', people: approved.slice(0, 4) },
    { icon: Calendar, label: 'Total bookings', value: bookings.length, color: 'hsl(var(--neon-magenta))' },
    { icon: DollarSign, label: 'Fees earned', value: feesEarnedLabel, color: 'hsl(var(--neon-lime))' },
    { icon: ClipboardCheck, label: 'Awaiting review', value: loadingLensmen ? '—' : pendingApplications.length, color: 'hsl(var(--neon-cyan))' },
  ];

  return (
    <div className="admin-shell min-h-screen">
      <div className="mx-auto max-w-[1400px] px-5 py-7 md:px-10 md:py-10">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="admin-hero p-6 sm:p-8 lg:p-10"
        >
          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="admin-kicker label-mono text-[8px]"><Sparkles className="h-3 w-3" aria-hidden="true" /> Internal command center</p>
              <h1 className="mt-5 font-heading text-white font-semibold leading-[0.9] tracking-[-0.055em]" style={{ fontSize: 'clamp(42px, 6vw, 78px)' }}>
                Stelli <span className="text-neon-lime">operations.</span>
              </h1>
              <p className="mt-5 max-w-xl font-body text-[14px] leading-relaxed text-white/55">
                A focused workspace for approvals, bookings, payouts, and the day-to-day running of the marketplace.
              </p>
              <p className="mt-3 font-body text-[12px] text-white/40">
                This page can move money. Keep two-factor sign-in on for this account.{' '}
                <a href="/mfa?returnTo=%2Fadmin" className="underline underline-offset-4 hover:text-white">Set up or check</a>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className="group relative z-10 flex min-w-[245px] items-center justify-between rounded-[20px] border border-neon-cyan/25 bg-neon-cyan/[0.09] p-4 text-left transition hover:border-neon-cyan/55 hover:bg-neon-cyan/[0.13]"
            >
              <span>
                <span className="label-mono text-[8px] text-neon-cyan">Next up</span>
                <span className="mt-2 block text-[14px] font-semibold text-white">
                  {pendingApplications.length ? pendingApplications.length + ' creator application' + (pendingApplications.length === 1 ? '' : 's') + ' waiting' : 'Review queue is clear'}
                </span>
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-neon-cyan text-ink transition-transform group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          </div>
        </motion.section>

        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Marketplace statistics">
          {stats.map((stat, i) => (
            <div key={i} className={CARD + ' admin-surface--interactive min-h-[154px] p-5'} style={SURFACE}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: stat.color.replace('))', ') / 0.12)'), color: stat.color }}>
                  <stat.icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                {stat.people ? (
                  <div className="flex items-center justify-end pl-3" aria-label="Active creator profiles">
                    {stat.people.length ? stat.people.map((creator, index) => (
                      creator.profile_image ? (
                        <img
                          key={creator.id}
                          src={creator.profile_image}
                          alt={creator.display_name || 'Creator'}
                          title={creator.display_name || 'Creator'}
                          className="-ml-3 h-9 w-9 rounded-full border-2 border-[hsl(var(--surface-2))] object-cover first:ml-0"
                          style={{ zIndex: stat.people.length - index }}
                        />
                      ) : (
                        <span
                          key={creator.id}
                          title={creator.display_name || 'Creator'}
                          className="-ml-3 grid h-9 w-9 place-items-center rounded-full border-2 border-[hsl(var(--surface-2))] bg-neon-lime/15 text-[10px] font-semibold text-neon-lime first:ml-0"
                          style={{ zIndex: stat.people.length - index }}
                        >
                          {(creator.display_name || 'C').slice(0, 1).toUpperCase()}
                        </span>
                      )
                    )) : (
                      <span className="label-mono text-[8px] text-white/35">No profiles yet</span>
                    )}
                  </div>
                ) : (
                  <span className="label-mono text-[8px] text-white/30">Live</span>
                )}
              </div>
              <p className="mt-6 font-heading text-4xl font-semibold leading-none text-white">{stat.value}</p>
              <p className="mt-2 label-mono text-[8px] text-white/42">{stat.label}</p>
              {stat.people && stat.people.length > 0 && (
                <p className="mt-3 text-[11px] text-white/35">The faces in your marketplace</p>
              )}
            </div>
          ))}
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="admin-tabbar mb-8 h-auto w-full justify-start">
            <TabsTrigger value="overview" className="admin-tab shrink-0 gap-2 px-4 label-mono text-[9px]">
              <LayoutDashboard className="h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="admin-tab shrink-0 gap-2 px-4 label-mono text-[9px]">
              <ClipboardCheck className="h-3.5 w-3.5" /> Applications <span className="rounded-full bg-black/10 px-1.5 py-0.5">{pendingApplications.length}</span>
            </TabsTrigger>
            <TabsTrigger value="lensmen" className="admin-tab shrink-0 gap-2 px-4 label-mono text-[9px]">
              <Users className="h-3.5 w-3.5" /> Creators <span className="rounded-full bg-black/10 px-1.5 py-0.5">{approved.length}</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="admin-tab shrink-0 gap-2 px-4 label-mono text-[9px]">
              <Calendar className="h-3.5 w-3.5" /> Bookings <span className="rounded-full bg-black/10 px-1.5 py-0.5">{bookings.length}</span>
            </TabsTrigger>
            <TabsTrigger value="flagged" className="admin-tab shrink-0 gap-2 px-4 label-mono text-[9px]">
              <CircleDollarSign className="h-3.5 w-3.5" /> Needs you <span className="rounded-full bg-black/10 px-1.5 py-0.5">{heldFunds.length}</span>
            </TabsTrigger>
            <TabsTrigger value="pay" className="admin-tab shrink-0 gap-2 px-4 label-mono text-[9px]">
              <DollarSign className="h-3.5 w-3.5" /> Pay creators
            </TabsTrigger>
            <TabsTrigger value="charge" className="admin-tab shrink-0 gap-2 px-4 label-mono text-[9px]">
              <DollarSign className="h-3.5 w-3.5" /> Payments
            </TabsTrigger>
            <TabsTrigger value="faq" className="admin-tab shrink-0 gap-2 px-4 label-mono text-[9px]">
              <MessageCircle className="h-3.5 w-3.5" /> FAQ chat
            </TabsTrigger>
            <TabsTrigger value="activity" className="admin-tab shrink-0 gap-2 px-4 label-mono text-[9px]">
              <History className="h-3.5 w-3.5" /> Activity
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

          <TabsContent value="activity">
            <DataFixCard />
            <AdminActivity />
          </TabsContent>

          <TabsContent value="lensmen" className="space-y-5">
            <section className="admin-surface flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
              <div>
                <p className="admin-kicker label-mono text-[8px]"><Users className="h-3 w-3" aria-hidden="true" /> Marketplace talent</p>
                <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-white">Active creators</h2>
                <p className="mt-2 font-body text-[13px] text-white/45">The people clients can currently discover and book.</p>
              </div>
              <label className="relative block w-full sm:max-w-[330px]">
                <span className="sr-only">Search active creators</span>
                <input
                  type="search"
                  value={creatorSearch}
                  onChange={(event) => setCreatorSearch(event.target.value)}
                  placeholder="Search name, specialty, or area…"
                  className="w-full rounded-2xl border border-white/12 bg-black/15 px-4 py-3 text-[13px] text-white placeholder:text-white/35 transition focus:border-neon-lime/60 focus:outline-none focus:ring-2 focus:ring-neon-lime/15"
                />
              </label>
            </section>

            {lensmenError ? (
              <p role="alert" className="rounded-2xl border border-neon-magenta/30 bg-neon-magenta/5 p-4 text-[13px] text-white/70">Creator profiles could not be loaded. Refresh the page and try again.</p>
            ) : loadingLensmen ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-[22px] bg-white/5" />)}
              </div>
            ) : filteredCreators.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredCreators.map((creator) => (
                  <article key={creator.id} className={CARD + ' admin-surface--interactive flex items-center gap-4 p-4 sm:p-5'} style={SURFACE}>
                    {creator.profile_image ? (
                      <img
                        src={creator.profile_image}
                        alt={creator.display_name || 'Creator'}
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-[20px] object-cover ring-1 ring-white/12"
                      />
                    ) : (
                      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-neon-lime/12 text-lg font-semibold text-neon-lime">
                        {(creator.display_name || 'C').slice(0, 1).toUpperCase()}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-heading text-[19px] font-semibold leading-tight text-white">{creator.display_name || 'Stelli creator'}</h3>
                        {creator.under_review ? (
                          <span className="label-mono rounded-full bg-neon-magenta/12 px-2 py-1 text-[7px] text-neon-magenta">On hold</span>
                        ) : (
                          <span className="label-mono rounded-full bg-neon-lime/12 px-2 py-1 text-[7px] text-neon-lime">Live</span>
                        )}
                      </div>
                      <p className="mt-2 truncate text-[12px] text-white/45">
                        {creator.neighborhoods?.join(' · ') || 'Area not listed'}
                      </p>
                      <p className="mt-1 truncate text-[12px] text-white/35">
                        {creator.specialties?.slice(0, 2).join(' · ') || 'Specialties not listed'}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                      <div className="hidden sm:block">
                        <RatingDisplay rating={creator.avg_rating} reviewCount={creator.review_count} />
                        <p className="mt-2 label-mono text-[8px] text-white/35">{creator.review_count || 0} review{creator.review_count === 1 ? '' : 's'}</p>
                      </div>
                      <CreatorHoldButton lensman={creator} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-surface p-12 text-center">
                <p className="font-body text-[13px] text-white/40">
                  {approved.length ? 'No creators match that search.' : 'No approved creators yet.'}
                </p>
              </div>
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

          <TabsContent value="flagged">
            <FounderQueueList bookings={bookings} strays={strays} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}