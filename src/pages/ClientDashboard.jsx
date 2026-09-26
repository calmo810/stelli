import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import MyAgreements from '@/components/dashboard/MyAgreements';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DashboardStack from '@/components/dashboard/stack/DashboardStack';
import StackTile from '@/components/dashboard/StackTile';
import NeedsYou from '@/components/dashboard/NeedsYou';
import GlassRows from '@/components/shared/GlassRows';
import Pill from '@/components/shared/Pill';
import useClientDashboard from '@/hooks/useClientDashboard';
import shortDate from '@/lib/shortDate';

export default function ClientDashboard() {
  const { user, upcoming, awaiting, past, quoteFor, isLoading } = useClientDashboard();

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

  const needs = [
    ...upcoming
      .filter((b) => quoteFor(b.id))
      .map((b) => ({
        id: `quote-${b.id}`,
        title: `${b.lensman_name || 'Your creator'} sent a quote`,
        meta: [shortDate(b.event_date), b.location].filter(Boolean).join(' · '),
        action: 'Review',
        to: `/messages/${b.id}`,
      })),
    ...awaiting.map((b) => ({
      id: `ready-${b.id}`,
      title: `${b.lensman_name || 'Your creator'} delivered your photos`,
      meta: `Shot ${shortDate(b.event_date)}`,
      action: 'View',
      to: `/album/${b.id}`,
    })),
  ];

  return (
    <DashboardStack parentPath="/client-dashboard">
      <DashboardShell>
        <h1
          className="font-display font-medium text-white"
          style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          Hey, {firstName}.
        </h1>
        <p className="mt-1.5 text-[16px] text-white/60">Your shoots, quotes and galleries in one place.</p>

        <div className="mt-5 grid grid-cols-2 gap-3.5">
          <StackTile
            to="/client-dashboard/bookings?tab=upcoming"
            label="Bookings"
            value={upcoming.length}
            hot={upcoming.length > 0}
          />
          <StackTile to="/client-dashboard/bookings?tab=awaiting" label="Awaiting photos" value={awaiting.length} />
          <StackTile to="/client-dashboard/bookings?tab=past" label="Delivered" value={past.length} />
        </div>

        <h3 className="mb-2.5 mt-8 pl-1.5 text-[13px] font-semibold text-white/50">Needs you</h3>
        <NeedsYou
          items={needs}
          empty={{
            icon: Sparkles,
            title: "You're all caught up.",
            body: 'Book your next shoot and it will show up here.',
            cta: (
              <Link to="/creators">
                <Pill>Browse creators</Pill>
              </Link>
            ),
          }}
        />

        {isLoading && <div className="mt-8 h-24 animate-pulse rounded-[28px] bg-white/[0.06]" />}

        <div className="mt-8">
          <MyAgreements role="client" />
        </div>

        <GlassRows
          className="mt-8"
          rows={[
            { label: 'Find a creator', to: '/creators' },
            { label: 'Messages', to: '/client-dashboard/messages' },
            { label: 'Account', to: '/account-settings' },
          ]}
        />
      </DashboardShell>
    </DashboardStack>
  );
}