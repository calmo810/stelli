import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import MyAgreements from '@/components/dashboard/MyAgreements';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NeedsYou from '@/components/dashboard/NeedsYou';
import ShootList from '@/components/dashboard/ShootList';
import GlassRows from '@/components/shared/GlassRows';
import Pill from '@/components/shared/Pill';
import useClientDashboard from '@/hooks/useClientDashboard';
import useThreads from '@/hooks/useThreads';
import shortDate from '@/lib/shortDate';

function SectionLabel({ children }) {
  return <h3 className="mb-2.5 mt-8 pl-1.5 text-[13px] font-semibold text-white/50">{children}</h3>;
}

/**
 * The client portal: one page, top to bottom.
 * What needs you, your shoots, and a short list of everything else.
 */
export default function ClientDashboard() {
  const { user, upcoming, awaiting, past, quoteFor, isLoading } = useClientDashboard();
  const { unreadCount } = useThreads();

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
    ...awaiting
      .filter((b) => b.delivery_link)
      .map((b) => ({
        id: `ready-${b.id}`,
        title: `${b.lensman_name || 'Your creator'} delivered your photos`,
        meta: `Shot ${shortDate(b.event_date)}`,
        action: 'View',
        to: b.album_token ? `/album/${b.id}?t=${b.album_token}` : `/album/${b.id}`,
      })),
  ];

  return (
    <DashboardShell>
      <h1
        className="font-display font-medium text-white"
        style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1.05 }}
      >
        Hey, {firstName}.
      </h1>

      <SectionLabel>To do</SectionLabel>
      <NeedsYou
        items={needs}
        empty={{
          icon: Sparkles,
          title: "You're all caught up.",
          body: 'Book your next shoot and it will show up here.',
          cta: (
            <Link to="/creators">
              <Pill>Find a creator</Pill>
            </Link>
          ),
        }}
      />

      <SectionLabel>Your shoots</SectionLabel>
      <ShootList
        role="client"
        active={[...upcoming, ...awaiting]}
        past={past}
        isLoading={isLoading}
        emptyText="Shoots you request will show up here."
      />

      <MyAgreements role="client" />

      <GlassRows
        className="mt-8"
        rows={[
          { label: 'Messages', to: '/messages', value: unreadCount ? `${unreadCount} new` : undefined },
          { label: 'Find a creator', to: '/creators' },
          { label: 'Account', to: '/account-settings' },
        ]}
      />
    </DashboardShell>
  );
}
