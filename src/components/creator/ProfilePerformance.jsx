import React from 'react';
import { Star } from 'lucide-react';

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[22px] font-extrabold leading-none tracking-tight text-ink">{value}</p>
      <p className="wk-small mt-1">{label}</p>
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
    <div className="wk-card wk-card--pad">
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Stat label="Profile views" value={views} />
        <Stat
          label={reviews === 1 ? 'From 1 review' : `From ${reviews} reviews`}
          value={
            rating ? (
              <span className="inline-flex items-center gap-1">
                {rating.toFixed(1)}
                <Star className="h-3.5 w-3.5" strokeWidth={2.2} style={{ color: '#8fa52c' }} />
              </span>
            ) : (
              '—'
            )
          }
        />
        <Stat label="Shoots delivered" value={shoots} />
        <Stat label="Typical reply" value={reply ? `${reply}m` : '—'} />
      </div>
    </div>
  );
}