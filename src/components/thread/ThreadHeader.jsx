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

  const nameBlock = (
    <>
      <h1 className="font-heading text-2xl sm:text-[30px] font-semibold text-white leading-tight">
        {talkingTo || 'Stelli'}
      </h1>
      <p className="label-mono text-[9px] text-white/40 mt-1.5">
        {role === 'lensman' ? 'MESSAGING · CLIENT' : 'MESSAGING · CREATOR'}
      </p>
    </>
  );

  return (
    <div className="border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-4 flex items-center gap-4">
        <div className="w-11 h-11 shrink-0 overflow-hidden bg-white/10 flex items-center justify-center" style={{ borderRadius: '50%' }}>
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="label-mono text-[10px] text-white/60">{initials(talkingTo)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {role === 'client' && profileHref ? (
            <Link to={profileHref} className="group inline-flex items-center gap-1.5 min-w-0">
              <span className="truncate">{nameBlock}</span>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-neon-lime transition-colors shrink-0" />
            </Link>
          ) : (
            nameBlock
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="label-mono text-[10px] text-white/60">
            {booking?.event_date ? format(new Date(`${booking.event_date}T12:00:00`), 'MMM d, yyyy') : '—'}
          </p>
          <span
            className="inline-block label-mono text-[8px] font-semibold px-2 py-1 mt-1.5"
            style={{ background: `hsl(var(--neon-${tone}) / 0.12)`, color: `hsl(var(--neon-${tone}))`, borderRadius: 3 }}
          >
            {chip}
          </span>
        </div>
      </div>
    </div>
  );
}