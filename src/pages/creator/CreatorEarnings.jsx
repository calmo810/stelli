import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PayoutsCard from '@/components/dashboard/PayoutsCard';
import Pill from '@/components/shared/Pill';
import SectionLabel from '@/components/creator/SectionLabel';
import money from '@/lib/money';

const LABELS = {
  released: 'Paid out',
  held: 'Held until delivery',
  processing: 'Clearing',
  refunded: 'Refunded',
  partially_refunded: 'Partly refunded',
  pending: 'Awaiting payment',
};

function Amount({ label, value, note, tone = 'rgba(255,255,255,0.35)' }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white/40">{label}</p>
      <p className="mt-1.5 font-display text-[24px] leading-none text-white">{value}</p>
      <p className="mt-1 text-[11px]" style={{ color: tone }}>
        {note}
      </p>
    </div>
  );
}

/** What is earned, what is still held, and what has actually landed. */
export default function CreatorEarnings() {
  const { myProfile, bookings, manualPayouts, money: totals, waitingTotal, payoutState, refetchProfile } =
    useOutletContext();

  const paid = bookings
    .filter((b) => Number(b.creator_payout) > 0)
    .sort((a, b) => String(b.event_date || '').localeCompare(String(a.event_date || '')));

  const openStripe = async () => {
    const response = await base44.functions.invoke('startPayoutSetup', {
      origin: window.location.origin,
      action: 'dashboard',
    });
    if (response.data?.url) window.open(response.data.url, '_blank', 'noopener');
  };

  return (
    <div>
      <h1 className="font-display text-[30px] font-medium leading-tight text-white">
        Earnings &amp; payouts
      </h1>
      <p className="mt-1.5 text-[14px] leading-snug text-white/50">
        Every charge is held by Stelli until you deliver, then it is yours.
      </p>

      <div className="glass mt-5 rounded-[26px] px-5 py-5">
        <div className="grid grid-cols-3 gap-3">
          <Amount label="Paid out" value={money(totals.paidTotal)} note="In your account" />
          <Amount
            label="Held for you"
            value={money(totals.heldTotal)}
            note="Releases on delivery"
            tone="hsl(var(--neon-lime))"
          />
          <Amount label="Quoted" value={money(totals.quotedTotal)} note="Waiting on clients" />
        </div>
      </div>

      {!myProfile.payouts_enabled && (
        <div className="mt-3">
          <PayoutsCard
            profile={myProfile}
            needsInfo={payoutState?.needsInfo}
            waitingTotal={waitingTotal}
            onRefresh={refetchProfile}
          />
        </div>
      )}

      <SectionLabel>Your shoots</SectionLabel>
      {paid.length ? (
        <div className="glass overflow-hidden rounded-[24px]">
          {paid.map((booking, i) => (
            <Link
              key={booking.id}
              to={`/messages/${booking.id}`}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.05]${
                i ? ' border-t border-white/[0.08]' : ''
              }`}
            >
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[15px] font-medium text-white">
                  {booking.client_name || 'Client'}
                </b>
                <small className="mt-0.5 block truncate text-[12.5px] text-white/45">
                  {booking.event_date
                    ? format(new Date(`${booking.event_date}T12:00:00`), 'MMM d, yyyy')
                    : 'No date'}
                  {' · '}
                  {LABELS[booking.payment_status] || 'Pending'}
                </small>
              </span>
              <span className="shrink-0 text-[15px] font-semibold text-white">
                {money(booking.creator_payout)}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass rounded-[24px] px-[18px] py-4">
          <p className="text-[14px] text-white/50">Shoots and their payouts will show up here.</p>
        </div>
      )}

      {manualPayouts.length > 0 && (
        <>
          <SectionLabel>Other payments from Stelli</SectionLabel>
          <div className="glass overflow-hidden rounded-[24px]">
            {manualPayouts.map((payout, i) => (
              <div
                key={payout.id}
                className={`flex items-center gap-3 px-4 py-3.5${i ? ' border-t border-white/[0.08]' : ''}`}
              >
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[15px] font-medium text-white">
                    {payout.note || 'Payment'}
                  </b>
                  <small className="mt-0.5 block text-[12.5px] text-white/45">
                    {payout.status === 'sent'
                      ? payout.sent_at
                        ? `Sent ${format(new Date(payout.sent_at), 'MMM d')}`
                        : 'Sent'
                      : 'On its way'}
                  </small>
                </span>
                <span className="shrink-0 text-[15px] font-semibold text-white">
                  {money(payout.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {myProfile.payouts_enabled && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Pill as="button" type="button" tone="glass" onClick={openStripe} className="py-3.5">
            Stripe dashboard <ExternalLink className="h-3.5 w-3.5" />
          </Pill>
          <Pill as={Link} to="/lensman-dashboard/bookings" tone="glass" className="py-3.5">
            See all shoots
          </Pill>
        </div>
      )}
    </div>
  );
}