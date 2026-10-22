import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react';
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
  confirmed: 'Booked — payment is held until the photos land.',
  in_progress: 'Shoot day — payment is held until the photos land.',
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

/** The top of a chat: who you're talking to, where the booking stands, and one clear action. */
export default function ThreadHeader({ booking, creator, role, talkingTo, profileHref, onQuote }) {
  const chip = statusChip(booking?.status);
  const tone = CHIP_TONE[chip] || 'cyan';
  const avatar = creator?.profile_image || creator?.cover_image;
  const next = NEXT_STEP[booking?.status];

  const name = (
    <span className="truncate text-[17px] font-semibold text-white">{talkingTo || 'Stelli'}</span>
  );

  return (
    <div className="shrink-0 border-b border-white/[0.08] bg-ink/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-3 py-3 sm:px-5">
        <Link
          to="/messages"
          aria-label="Back to all messages"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.07] text-white/70 transition-colors hover:text-white lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="hidden h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 sm:grid">
          {avatar && role === 'client' ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[12px] font-semibold text-white/60">{initials(talkingTo)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {role === 'client' && profileHref ? (
              <Link to={profileHref} className="group inline-flex min-w-0 items-center gap-1">
                {name}
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-neon-lime" />
              </Link>
            ) : (
              name
            )}
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: `hsl(var(--neon-${tone}) / 0.14)`, color: `hsl(var(--neon-${tone}))` }}
            >
              {chip}
            </span>
          </div>
          {next && <p className="mt-0.5 truncate text-[12px] text-white/45">{next}</p>}
        </div>

        {onQuote && (
          <button
            type="button"
            onClick={onQuote}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform active:scale-[0.96]"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Send a quote</span>
            <span className="sm:hidden">Quote</span>
          </button>
        )}
      </div>
    </div>
  );
}
