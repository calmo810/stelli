import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { statusChip } from '@/lib/threadStatus';

const CHIP_TONE = {
  REQUESTED: 'cyan',
  'QUOTE SENT': 'magenta',
  CONFIRMED: 'lime',
  DELIVERED: 'lime',
  CANCELLED: 'magenta',
  'UNDER REVIEW': 'magenta',
};

// One plain line so either side always knows where the booking stands.
const NEXT_STEP = {
  requested: 'Waiting on a quote — nothing is charged yet.',
  quoted: 'Quote sent — accept it to lock in the date.',
  quote_accepted: 'Quote accepted — waiting on payment.',
  pending: 'Quote sent — accept it to lock in the date.',
  awaiting_creator_acceptance: 'Quote sent — accept it to lock in the date.',
  confirmed: 'Booked — your payment is held until the photos land.',
  in_progress: 'Shoot day — your payment is held until the photos land.',
  awaiting_delivery: 'Shot — waiting on the photos.',
  delivered: 'Delivered — payment releases after the 48 hour window.',
  completed: 'All done — the payment has been released.',
  cancelled: 'This booking was cancelled.',
  disputed: 'Under review by the Stelli team.',
};

function initials(name) {
  return String(name || 'S')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ThreadHeader({ booking, creator, role, talkingTo, profileHref }) {
  const chip = statusChip(booking?.status);
  const tone = CHIP_TONE[chip] || 'cyan';
  const avatar = creator?.profile_image || creator?.cover_image;
  const next = NEXT_STEP[booking?.status];

  return (
    <div className="border-b border-white/[0.08]">
      <div className="mx-auto w-full max-w-[640px] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[12px] font-semibold text-white/60">{initials(talkingTo)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {role === 'client' && profileHref ? (
              <Link to={profileHref} className="group inline-flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[18px] font-semibold text-white">{talkingTo || 'Stelli'}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-neon-lime" />
              </Link>
            ) : (
              <p className="truncate text-[18px] font-semibold text-white">{talkingTo || 'Stelli'}</p>
            )}
            <p className="mt-0.5 text-[11px] font-semibold text-white/40">
              {role === 'lensman' ? 'MESSAGING · CLIENT' : 'MESSAGING · CREATOR'}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[12px] text-white/55">
              {booking?.event_date ? format(new Date(`${booking.event_date}T12:00:00`), 'MMM d, yyyy') : '—'}
            </p>
            <span
              className="mt-1 inline-block rounded-[980px] px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: `hsl(var(--neon-${tone}) / 0.14)`, color: `hsl(var(--neon-${tone}))` }}
            >
              {chip}
            </span>
          </div>
        </div>

        {next && <p className="mt-3 text-[13px] text-white/50">{next}</p>}
      </div>
    </div>
  );
}