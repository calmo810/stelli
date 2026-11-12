import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import NextPast from '@/components/creator/workspace/NextPast';
import WorkspaceEmpty from '@/components/creator/workspace/WorkspaceEmpty';
import RequestRow from '@/components/creator/RequestRow';
import WorkTabs from '@/components/creator/workspace/WorkTabs';

const EMPTY = {
  next: 'New requests land here. Answer inside 48 hours to keep your response time strong.',
  past: 'Delivered and closed requests move here.',
};

/** Every request, split into what still wants an answer and what is done. */
export default function CreatorRequests() {
  const { newRequests, quotedBookings, finished, isLoading } = useOutletContext();
  const [tab, setTab] = useState('next');

  const next = [...newRequests, ...quotedBookings].sort((a, b) =>
    String(b.created_date).localeCompare(String(a.created_date))
  );
  const past = [...finished].reverse();
  const list = tab === 'next' ? next : past;

  return (
    <div>
      <h1 className="wk-h1">Requests</h1>
      <p className="wk-lede">Open one to read the brief, message the client, and send your quote.</p>

      <div className="mt-4">
        <WorkTabs requests={next.length} />
      </div>

      <div className="mt-4">
        <NextPast value={tab} onChange={setTab} nextCount={next.length} pastCount={past.length} />
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="wk-card h-[160px] animate-pulse" />
        ) : list.length ? (
          <div className="wk-list">
            {list.map((booking) => (
              <RequestRow key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <WorkspaceEmpty icon={Inbox} title="Nothing here yet" body={EMPTY[tab]} />
        )}
      </div>
    </div>
  );
}