import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

function Row({ to, label, value }) {
  return (
    <Link
      to={to}
      className="flex min-h-[58px] items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5"
    >
      <span className="min-w-0 flex-1">
        <b className="block text-[14.5px] font-bold text-ink">{label}</b>
        <small className="mt-0.5 block truncate text-[12.5px] wk-grey">{value}</small>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 wk-mute" strokeWidth={2.4} />
    </Link>
  );
}

/** The rest of the storefront, in one glanceable list. */
export default function ProfileDetails({ profile, contact = null }) {
  const area = (profile.neighborhoods || []).join(', ');
  const blackouts = profile.blackout_dates || [];

  return (
    <section className="wk-card overflow-hidden">
      <p className="wk-label px-4 pb-1 pt-4">Details</p>
      <div className="divide-y divide-black/10">
        <Row
          to="/lensman-dashboard/profile/you"
          label="Photo & name"
          value={profile.display_name || 'Not set'}
        />
        <Row
          to="/lensman-dashboard/profile/work"
          label="Where you shoot"
          value={area || 'Anywhere on campus'}
        />
        <Row
          to="/lensman-dashboard/profile/look"
          label="Your look"
          value={[profile.wall_layout, profile.print_frame, profile.accent_color].filter(Boolean).join(' · ') || 'Studio default'}
        />
        <Row
          to="/lensman-dashboard/profile/contact"
          label="Private contact"
          value={contact?.email || 'Only Stelli sees this'}
        />
        <Row
          to="/lensman-dashboard/calendar"
          label="Availability"
          value={
            blackouts.length
              ? `${blackouts.length} day${blackouts.length === 1 ? '' : 's'} blocked`
              : 'Open every day'
          }
        />
      </div>
    </section>
  );
}