import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { ExternalLink, Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PayoutsCard from '@/components/dashboard/PayoutsCard';
import NextPast from '@/components/creator/workspace/NextPast';
import WorkspaceEmpty from '@/components/creator/workspace/WorkspaceEmpty';
import WorkTabs from '@/components/creator/workspace/WorkTabs';
import money from '@/lib/money';

const LABELS = {
  released: 'Paid out',
  held: 'Held until delivery',
  processing: 'Clearing',
  refunded: 'Refunded',
  partially_refunded: 'Partly refunded',
  pending: 'Awaiting payment',
};

const byDateDesc = (a, b) => String(b.event_date || '').localeCompare(String(a.event_date || ''));
const byDateAsc = (a, b) => String(a.event_date || '').localeCompare(String(b.event_date || ''));

/** What is earned, what is still held, and what has actually landed. */
export default function CreatorEarnings() {
  const {
    myProfile,
    bookings,
    manualPayouts,
    newRequests,
    money: totals,
    waitingTotal,
    payoutState,
    refetchProfile,
  } = /** @type {any} */ (useOutletContext());
  const [tab, setTab] = useState('next');

  const withMoney = bookings.filter((b) => Number(b.creator_payout) > 0);
  const held = withMoney
    .filter((b) => b.payment_status !== 'released' && !b.released_at)
    .sort(byDateAsc);
  const paid = withMoney
    .filter((b) => b.payment_status === 'released' || b.released_at)
    .sort(byDateDesc);

  const openStripe = async () => {
    try {
      const response = await base44.functions.invoke('startPayoutSetup', {
        origin: window.location.origin,
        action: 'dashboard',
      });
      if (response.data?.url) window.open(response.data.url, '_blank', 'noopener');
    } catch (error) {
      console.error('Stripe dashboard link failed:', error.message);
    }
  };

  return (
    <div className="arch-tab arch-tab--work">
      <div className="arch-tab__topline">
        <div className="arch-tab__heading">
          <h1 className="wk-h1">Money</h1>
          <p className="wk-lede">See what is held, clearing, and paid out.</p>
        </div>
        <nav className="arch-tab__nav" aria-label="Work sections">
          <WorkTabs requests={newRequests.length} />
        </nav>
      </div>

      <div className="wk-card wk-card--pad mt-2.5">
        <p className="wk-label">Paid out</p>
        <p className="wk-big mt-2">{money(totals.paidTotal)}</p>
        <p className="wk-small mt-1">In your account</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="wk-tile wk-tile--lime">
            <p className="wk-label">Held for you</p>
            <p className="mt-1 text-[17px] font-extrabold tracking-tight text-ink">{money(totals.heldTotal)}</p>
            <p className="wk-small">Releases on delivery</p>
          </div>
          <div className="wk-tile">
            <p className="wk-label">Quoted</p>
            <p className="mt-1 text-[17px] font-extrabold tracking-tight text-ink">{money(totals.quotedTotal)}</p>
            <p className="wk-small">Waiting on clients</p>
          </div>
        </div>
      </div>

      {!myProfile.payouts_enabled && (
        <div className="mt-2.5">
          <PayoutsCard
            profile={myProfile}
            needsInfo={payoutState?.needsInfo}
            waitingTotal={waitingTotal}
            onRefresh={refetchProfile}
          />
        </div>
      )}

      <div className="arch-tab__toolbar mt-5">
        <NextPast value={tab} onChange={setTab} nextCount={held.length} pastCount={paid.length} />
        <p className="arch-tab__count">{tab === 'next' ? `${held.length} held` : `${paid.length} paid`}</p>
      </div>

      <div className="mt-3">
        {tab === 'next' ? (
          held.length ? (
            <div className="wk-list">
              {held.map((booking) => (
                <Link key={booking.id} to={`/messages/${booking.id}`} className="wk-row">
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] font-bold text-ink">
                      {booking.client_name || 'Client'}
                    </b>
                    <span className="mt-0.5 block truncate text-[12.5px] wk-grey">
                      {booking.event_date
                        ? format(new Date(`${booking.event_date}T12:00:00`), 'MMM d, yyyy')
                        : 'No date'}
                      {' · '}
                      {LABELS[booking.payment_status] || 'Pending'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[15px] font-extrabold text-ink">
                    {money(booking.creator_payout)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <WorkspaceEmpty
              tone="workbench"
              icon={Wallet}
              title="Nothing held right now"
              body="Money is held here from the moment a client pays until you deliver."
            />
          )
        ) : paid.length || manualPayouts.length ? (
          <div className="wk-list">
            {paid.map((booking) => (
              <Link key={booking.id} to={`/messages/${booking.id}`} className="wk-row">
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[15px] font-bold text-ink">
                    {booking.client_name || 'Client'}
                  </b>
                  <span className="mt-0.5 block truncate text-[12.5px] wk-grey">
                    {booking.event_date
                      ? format(new Date(`${booking.event_date}T12:00:00`), 'MMM d, yyyy')
                      : 'No date'}
                    {' · '}
                    {LABELS[booking.payment_status] || 'Paid'}
                  </span>
                </span>
                <span className="shrink-0 text-[15px] font-extrabold text-ink">
                  {money(booking.creator_payout)}
                </span>
              </Link>
            ))}
            {manualPayouts.map((payout) => (
              <div key={payout.id} className="wk-row">
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[15px] font-bold text-ink">
                    {payout.note || 'Payment from Stelli'}
                  </b>
                  <span className="mt-0.5 block text-[12.5px] wk-grey">
                    {payout.status === 'sent'
                      ? payout.sent_at
                        ? `Sent ${format(new Date(payout.sent_at), 'MMM d')}`
                        : 'Sent'
                      : 'On its way'}
                  </span>
                </span>
                <span className="shrink-0 text-[15px] font-extrabold text-ink">{money(payout.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <WorkspaceEmpty tone="workbench" icon={Wallet} title="Nothing paid out yet" body="Payouts show up here once delivered." />
        )}
      </div>

      {myProfile.payouts_enabled && (
        <button type="button" onClick={openStripe} className="wk-btn wk-btn--ghost mt-5 w-full">
          Stripe dashboard <ExternalLink className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}