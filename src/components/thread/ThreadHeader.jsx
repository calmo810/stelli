import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react';
import { CHIP_TONE, statusChip } from '@/lib/threadStatus';
import { statusLine } from '@/lib/bookingNextStep';

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
  const chip = statusChip(booking);
  const tone = CHIP_TONE[chip] || 'cyan';
  const avatar = creator?.profile_image || creator?.cover_image;
  // One plain line so either side always knows where the booking stands.
  const next = booking ? statusLine(booking, role) : '';

  const name = (
    <span className="truncate text-[17px] font-semibold text-fg">{talkingTo || 'Stelli'}</span>
  );

  return (
    <div className="shrink-0 border-b border-line bg-[var(--bar)] backdrop-blur-xl">
      <div className="flex items-center gap-3 px-3 py-3 sm:px-5">
        <Link
          to="/messages"
          aria-label="Back to all messages"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fill text-fg-2 transition-colors hover:text-fg lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="hidden h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-fill sm:grid">
          {avatar && role === 'client' ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[12px] font-semibold text-fg-2">{initials(talkingTo)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {role === 'client' && profileHref ? (
              <Link to={profileHref} className="group inline-flex min-w-0 items-center gap-1">
                {name}
                <ArrowUpRight className="h-4 w-4 shrink-0 text-fg-3 transition-colors group-hover:text-accent2" />
              </Link>
            ) : (
              name
            )}
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: `var(--chip-${tone}-bg)`, color: `var(--chip-${tone}-fg)` }}
            >
              {chip}
            </span>
          </div>
          {next && <p className="mt-0.5 truncate text-[12px] text-fg-3">{next}</p>}
        </div>

        {onQuote && (
          <button
            type="button"
            onClick={onQuote}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform active:scale-[0.96]"
            style={{ background: 'var(--st-primary)', color: 'var(--st-on-primary)' }}
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
