import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-display text-[22px] leading-none text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-white/40">{label}</p>
    </div>
  );
}

/** How the storefront is doing: looks, trust, and how fast they answer. */
export default function ProfilePerformance({ profile }) {
  const views = Number(profile?.profile_views || 0);
  const rating = Number(profile?.avg_rating || 0);
  const reviews = Number(profile?.review_count || 0);
  const shoots = Number(profile?.completed_shoots || 0);
  const reply = Number(profile?.response_median_minutes || 0);

  return (
    <div className="glass rounded-[24px] px-5 py-5">
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Stat label="Profile views" value={views} />
        <Stat
          label={reviews === 1 ? 'From 1 review' : `From ${reviews} reviews`}
          value={
            rating ? (
              <span className="inline-flex items-center gap-1">
                {rating.toFixed(1)}
                <Star className="h-3.5 w-3.5" strokeWidth={2.2} style={{ color: 'hsl(var(--neon-lime))' }} />
              </span>
            ) : (
              '—'
            )
          }
        />
        <Stat label="Shoots delivered" value={shoots} />
        <Stat label="Typical reply" value={reply ? `${reply}m` : '—'} />
      </div>

      <Link
        to="/lensman-dashboard/profile"
        className="mt-4 inline-block text-[13px] font-semibold"
        style={{ color: 'hsl(var(--neon-lime))' }}
      >
        Improve your storefront →
      </Link>
    </div>
  );
}