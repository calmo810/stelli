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
    <div>
      <h1 className="wk-h1">Shoots</h1>
      <p className="wk-lede">Tap a shoot to open the thread, post the gallery, and close it out.</p>

      <div className="mt-4">
        <WorkTabs requests={newRequests.length} />
      </div>

      <div className="mt-4">
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

      <MyAgreements role="lensman" light />
    </div>
  );
}