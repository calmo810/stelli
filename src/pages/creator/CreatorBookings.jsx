import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CalendarDays, Camera } from 'lucide-react';
import NextPast from '@/components/creator/workspace/NextPast';
import WorkspaceEmpty from '@/components/creator/workspace/WorkspaceEmpty';
import MyAgreements from '@/components/dashboard/MyAgreements';
import UpcomingShoots from '@/components/creator/UpcomingShoots';

/** The shoots themselves — what is booked, what is done, what needs signing. */
export default function CreatorBookings() {
  const { confirmed, finished } = useOutletContext();
  const [tab, setTab] = useState('next');

  const past = [...finished].reverse();
  const list = tab === 'next' ? confirmed : past;

  return (
    <div>
      <h1 className="wk-h1">Shoots</h1>
      <p className="wk-lede">Tap a shoot to open the thread, post the gallery, and close it out.</p>

      <div className="mt-5">
        <NextPast value={tab} onChange={setTab} nextCount={confirmed.length} pastCount={past.length} />
      </div>

      <div className="mt-3">
        {list.length ? (
          <UpcomingShoots
            shoots={list}
            emptyText={
              tab === 'next'
                ? 'Accepted quotes show up here as shoots.'
                : 'Finished shoots will show up here.'
            }
          />
        ) : (
          <WorkspaceEmpty
            icon={Camera}
            title={tab === 'next' ? 'No shoots booked' : 'Nothing finished yet'}
            body={
              tab === 'next'
                ? 'Accepted quotes show up here as shoots.'
                : 'Finished shoots will show up here.'
            }
          />
        )}
      </div>

      <div className="mt-2.5">
        <Link to="/lensman-dashboard/calendar" className="wk-card wk-row">
          <CalendarDays className="h-[18px] w-[18px] shrink-0 wk-grey" strokeWidth={2} />
          <span className="min-w-0 flex-1">
            <b className="block text-[14.5px] font-bold text-ink">Manage your availability</b>
            <span className="mt-0.5 block text-[12.5px] wk-mute">Mark the days you are off</span>
          </span>
          <span aria-hidden className="text-[13px] font-bold wk-mute">→</span>
        </Link>
      </div>

      <MyAgreements role="lensman" light />
    </div>
  );
}