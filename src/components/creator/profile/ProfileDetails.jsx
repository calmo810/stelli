import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { lookSummary } from '@/lib/creatorProfile';

function Row({ to, label, value }) {
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-[58px] items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5"
      >
        <span className="min-w-0 flex-1">
          <b className="block text-[14.5px] font-bold text-ink">{label}</b>
          <small className="mt-0.5 block truncate text-[12.5px] wk-grey">{value}</small>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 wk-mute" strokeWidth={2.4} aria-hidden />
      </Link>
    </li>
  );
}

/** The rest of the storefront, in one glanceable list. Each line opens where it is changed. */
export default function ProfileDetails({ profile }) {
  const specialties = (profile.specialties || []).join(' · ');
  const tags = (profile.style_tags || []).join(' · ');
  const blackouts = profile.blackout_dates || [];

  return (
    <section className="wk-card overflow-hidden" aria-labelledby="storefront-details">
      <h2 id="storefront-details" className="wk-label px-4 pb-1 pt-4">Details</h2>
      <ul className="divide-y divide-black/10">
        <Row to="/edit-profile?step=what" label="What you shoot" value={specialties || 'Not added yet'} />
        <Row to="/edit-profile?step=line" label="One-liner and tags" value={profile.one_liner || tags || 'Not added yet'} />
        <Row to="/edit-profile?step=look" label="Your look" value={lookSummary(profile)} />
        <Row
          to="/lensman-dashboard/calendar"
          label="Availability"
          value={
            blackouts.length
              ? `${blackouts.length} day${blackouts.length === 1 ? '' : 's'} blocked`
              : 'Open every day'
          }
        />
      </ul>
    </section>
  );
}
