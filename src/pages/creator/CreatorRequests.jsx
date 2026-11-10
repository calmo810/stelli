import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import SegmentedTabs from '@/components/dashboard/SegmentedTabs';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import RequestRow from '@/components/creator/RequestRow';

const EMPTY = {
  new: 'New requests land here. Answer inside 48 hours to keep your response time strong.',
  quoted: 'Quotes you send wait here until the client answers.',
  confirmed: 'Accepted quotes become shoots here.',
  done: 'Delivered shoots move here once they close.',
};

/** Every request in one place, sorted by how far along it is. */
export default function CreatorRequests() {
  const { newRequests, quotedBookings, confirmed, finished, isLoading } = useOutletContext();
  const [tab, setTab] = useState('new');

  const groups = {
    new: newRequests,
    quoted: quotedBookings,
    confirmed,
    done: finished,
  };
  const list = groups[tab] || [];

  return (
    <div>
      <h1 className="font-display text-[30px] font-medium leading-tight text-white">Booking requests</h1>
      <p className="mt-1.5 text-[14px] leading-snug text-white/50">
        Open a request to read the brief, message the client, and send your quote.
      </p>

      <div className="mt-5">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'new', label: 'New', count: newRequests.length },
            { value: 'quoted', label: 'Quoted', count: quotedBookings.length },
            { value: 'confirmed', label: 'Confirmed', count: confirmed.length },
            { value: 'done', label: 'Done', count: finished.length },
          ]}
        />
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="glass h-[160px] animate-pulse rounded-[24px]" />
        ) : list.length ? (
          <div className="glass overflow-hidden rounded-[24px]">
            {list.map((booking, i) => (
              <div key={booking.id} className={i ? 'border-t border-white/[0.08]' : ''}>
                <RequestRow booking={booking} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanel icon={Inbox} title="Nothing here yet" body={EMPTY[tab]} />
        )}
      </div>
    </div>
  );
}