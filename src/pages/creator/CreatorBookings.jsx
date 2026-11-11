import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import SegmentedTabs from '@/components/dashboard/SegmentedTabs';
import MyAgreements from '@/components/dashboard/MyAgreements';
import Pill from '@/components/shared/Pill';
import UpcomingShoots from '@/components/creator/UpcomingShoots';

/** The shoots themselves — what is booked, what is done, what needs signing. */
export default function CreatorBookings() {
  const { upcomingShoots, finished } = useOutletContext();
  const [tab, setTab] = useState('upcoming');

  const past = [...finished].reverse();
  const list = tab === 'upcoming' ? upcomingShoots : past;

  return (
    <div>
      <h1 className="font-display text-[30px] font-medium leading-tight text-white">My bookings</h1>
      <p className="mt-1.5 text-[14px] leading-snug text-white/50">
        Tap a shoot to open the conversation, post the gallery, and close it out.
      </p>

      <div className="mt-5">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: 'Upcoming', count: upcomingShoots.length },
            { value: 'past', label: 'Past', count: past.length },
          ]}
        />
      </div>

      <div className="mt-3">
        <UpcomingShoots
          shoots={list}
          emptyText={
            tab === 'upcoming'
              ? 'Accepted quotes show up here as shoots.'
              : 'Finished shoots will show up here.'
          }
        />
      </div>

      <MyAgreements role="lensman" />

      <div className="mt-6">
        <Pill as={Link} to="/lensman-dashboard/calendar" tone="glass">
          Manage your availability
        </Pill>
      </div>
    </div>
  );
}