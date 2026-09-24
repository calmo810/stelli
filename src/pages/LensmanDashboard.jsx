import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Calendar, Inbox, Link2, MessageCircle, Pencil } from 'lucide-react';
import BookingCard from '../components/dashboard/BookingCard';
import QuoteForm from '../components/dashboard/QuoteForm';
import DeliveryForm from '../components/dashboard/DeliveryForm';
import PayoutsCard from '../components/dashboard/PayoutsCard';
import PayoutNotice from '../components/dashboard/PayoutNotice';
import PendingBanner from '../components/dashboard/PendingBanner';
import AgeConfirmGate from '../components/dashboard/AgeConfirmGate';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import MyAgreements from '@/components/dashboard/MyAgreements';
import { Link } from 'react-router-dom';
import { displayNameOf } from '@/lib/profilePresets';

const UPCOMING = ['quoted', 'quote_accepted'];
const DELIVERIES = ['confirmed', 'in_progress', 'awaiting_delivery'];
const COMPLETED = ['delivered', 'completed'];

export default function LensmanDashboard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('requests');
  const [payoutState, setPayoutState] = useState(null);
  const payoutChecked = useRef(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: myProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['my-lensman-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lensman-bookings', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Booking.filter({ lensman_email: user.email }, '-created_date'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['lensman-bookings'] });

  const { data: waitingPayouts = [] } = useQuery({
    queryKey: ['waiting-payouts', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Booking.filter({ needs_payout_setup: true, lensman_email: user.email }),
  });

  const waitingTotal = waitingPayouts.reduce((sum, b) => sum + Number(b.creator_payout || 0), 0);

  // Every time the dashboard opens for a creator mid-setup, ask Stripe where
  // they stand — webhooks are not relied on for this.
  useEffect(() => {
    if (payoutChecked.current) return;
    if (!myProfile?.stripe_account_id || myProfile.payouts_enabled) return;
    payoutChecked.current = true;
    (async () => {
      try {
        const response = await base44.functions.invoke('startPayoutSetup', { action: 'status' });
        setPayoutState(response.data || null);
        if (response.data?.paidOut) {
          queryClient.invalidateQueries({ queryKey: ['waiting-payouts'] });
        }
        await refetchProfile();
      } catch (error) {
        console.error('Payout status check failed:', error.message);
      }
    })();
  }, [myProfile?.stripe_account_id, myProfile?.payouts_enabled, refetchProfile, queryClient]);

  // Creators who joined before the 18+ check existed confirm it once, here.
  if (myProfile && !myProfile.age_confirmed) {
    return <AgeConfirmGate onConfirmed={refetchProfile} />;
  }

  const requests = bookings.filter((b) => b.status === 'requested');
  const upcoming = bookings.filter((b) => UPCOMING.includes(b.status));
  const deliveries = bookings.filter((b) => DELIVERIES.includes(b.status));
  const completed = bookings.filter((b) => COMPLETED.includes(b.status));

  return (
    <div className="min-h-screen bg-ink">
      <div className="border-b border-white/10 py-12 px-5 md:px-10">
        <div className="max-w-[1180px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="label-mono text-[9px] text-white/35 mb-4">Creator Home Base</p>
            <h1 className="font-heading text-white font-semibold leading-[0.95] mb-3" style={{ fontSize: 'clamp(34px, 4.5vw, 60px)' }}>
              Creator Dashboard
            </h1>
            <p className="font-body text-[13px] text-white/50">
              Answer requests with a private quote, then deliver the gallery link.
            </p>
            <Link
              to="/portal/messages"
              className="inline-flex items-center gap-2 mt-5 border border-white/15 px-4 py-2 label-mono text-[10px] text-white/70 hover:text-white transition-colors"
              style={{ borderRadius: 4 }}
            >
              <MessageCircle className="w-3.5 h-3.5" /> Messages
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-8">
        <PayoutNotice state={payoutState} onRefresh={refetchProfile} />

        {/* Review banner, then Edit your profile, then the preview link. */}
        {myProfile?.status === 'pending' && <PendingBanner />}
        {myProfile?.under_review && (
          <div className="mb-6 border px-5 py-4" style={{ borderColor: 'hsl(var(--neon-magenta) / 0.5)', borderRadius: 4 }}>
            <p className="font-body text-[12px] leading-relaxed text-white/70">
              Your profile is under review by the Stelli team after a cancellation.
            </p>
          </div>
        )}

        {myProfile && (
          <div className="mb-6">
            <Link
              to="/edit-profile"
              className="w-full inline-flex items-center justify-center gap-2.5 px-8 font-body font-semibold text-[15px] transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: '#2AE8F8', color: '#0a0f1e', minHeight: 64, borderRadius: 4 }}
            >
              <Pencil className="w-4 h-4" /> Edit your profile
            </Link>
            <div className="mt-3 text-center">
              <a
                href={`/creators/${myProfile.slug || myProfile.id}`}
                target="_blank"
                rel="noreferrer"
                className="font-body text-[12px] text-white/50 hover:text-white underline underline-offset-4"
              >
                Preview my profile.
              </a>
            </div>
          </div>
        )}

        {myProfile && (
          <PayoutsCard
            profile={myProfile}
            needsInfo={payoutState?.needsInfo}
            waitingTotal={waitingTotal}
            onRefresh={refetchProfile}
          />
        )}

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
            <div key={i} className="border p-4 text-center" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
              <stat.icon className="w-4 h-4 mx-auto mb-2 text-white/35" strokeWidth={1.6} />
              <p className="font-heading text-3xl font-semibold text-white leading-none mb-2">{stat.value}</p>
              <p className="label-mono text-[8px] text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-transparent border border-white/10 rounded-none p-1 flex-wrap h-auto">
            <TabsTrigger value="requests" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-cyan data-[state=active]:text-ink">
              Requests ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-cyan data-[state=active]:text-ink">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-cyan data-[state=active]:text-ink">
              Deliveries ({deliveries.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-none label-mono text-[10px] text-white/45 data-[state=active]:bg-neon-cyan data-[state=active]:text-ink">
              Completed ({completed.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              <TabsContent value="requests" className="space-y-4">
                {requests.length > 0 ? requests.map((b) => (
                  <div key={b.id} className="space-y-3">
                    <BookingCard booking={b} role="lensman" />
                    <QuoteForm booking={b} onSent={refresh} />
                  </div>
                )) : (
                  <p className="font-body text-[13px] text-center py-16 text-white/35">No new requests right now.</p>
                )}
              </TabsContent>
              <TabsContent value="upcoming" className="space-y-4">
                {upcoming.length > 0 ? upcoming.map((b) => <BookingCard key={b.id} booking={b} role="lensman" />) : (
                  <p className="font-body text-[13px] text-center py-16 text-white/35">No quoted bookings yet.</p>
                )}
              </TabsContent>
              <TabsContent value="deliveries" className="space-y-4">
                {deliveries.length > 0 ? deliveries.map((b) => (
                  <div key={b.id} className="space-y-3">
                    <BookingCard booking={b} role="lensman" />
                    <DeliveryForm booking={b} onDelivered={refresh} />
                  </div>
                )) : (
                  <p className="font-body text-[13px] text-center py-16 text-white/35">Nothing waiting on delivery.</p>
                )}
              </TabsContent>
              <TabsContent value="completed" className="space-y-4">
                {completed.length > 0 ? completed.map((b) => <BookingCard key={b.id} booking={b} role="lensman" />) : (
                  <p className="font-body text-[13px] text-center py-16 text-white/35">No completed bookings yet.</p>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <Link to="/account-settings" className="font-body text-[12px] text-white/45 hover:text-white underline underline-offset-4">
            Account settings.
          </Link>
        </div>
      </div>
    </div>
  );
}