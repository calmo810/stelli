import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Camera } from 'lucide-react';
import NextPast from '@/components/creator/workspace/NextPast';
import WorkspaceEmpty from '@/components/creator/workspace/WorkspaceEmpty';
import MyAgreements from '@/components/dashboard/MyAgreements';
import UpcomingShoots from '@/components/creator/UpcomingShoots';
import WorkTabs from '@/components/creator/workspace/WorkTabs';

/** The shoots themselves — what is booked, what is done, what needs signing. */
export default function CreatorBookings() {
  const { confirmed, finished, newRequests } = /** @type {any} */ (useOutletContext());
  const [tab, setTab] = useState('next');

  const past = [...finished].reverse();
  const list = tab === 'next' ? confirmed : past;

  return (
    <div className="arch-tab arch-tab--work">
      <div className="arch-tab__topline">
        <div className="arch-tab__heading">
          <h1 className="wk-h1">Shoots</h1>
          <p className="wk-lede">Everything confirmed, finished, and ready to share.</p>
        </div>
        <nav className="arch-tab__nav" aria-label="Work sections">
          <WorkTabs requests={newRequests.length} />
        </nav>
      </div>

      <div className="arch-tab__toolbar">
        <NextPast value={tab} onChange={setTab} nextCount={confirmed.length} pastCount={past.length} />
        <p className="arch-tab__count">{tab === 'next' ? `${confirmed.length} ahead` : `${past.length} complete`}</p>
      </div>

      <div className="arch-tab__content">
        {list.length ? (
          <UpcomingShoots
            shoots={list}
            emptyText={
              tab === 'next'
                ? 'Confirmed bookings appear here.'
                : 'Completed shoots appear here.'
            }
          />
        ) : (
          <WorkspaceEmpty
            tone="workbench"
            icon={Camera}
            title={tab === 'next' ? 'No upcoming shoots' : 'Nothing completed yet'}
            body={
              tab === 'next'
                ? 'Confirmed bookings appear here.'
                : 'Completed shoots appear here.'
            }
          />
        )}
      </div>

      <div className="arch-tab__secondary">
        <MyAgreements role="lensman" />
      </div>
    </div>
  );
}