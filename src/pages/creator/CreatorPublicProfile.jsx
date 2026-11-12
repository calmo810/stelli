import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import PhotoReleases from '@/components/dashboard/PhotoReleases';
import ProfilePerformance from '@/components/creator/ProfilePerformance';

function Row({ to, label, value }) {
  return (
    <Link to={to} className="wk-row">
      <span className="min-w-0 flex-1">
        <b className="block text-[14.5px] font-bold text-ink">{label}</b>
        <small className="mt-0.5 block truncate text-[12.5px] wk-grey">{value}</small>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 wk-mute" strokeWidth={2.4} />
    </Link>
  );
}

/** The storefront: everything a client judges before they send a date. */
export default function CreatorPublicProfile() {
  const { myProfile, user, metrics } = useOutletContext();

  const photos = myProfile.portfolio_images || [];
  const cover = myProfile.cover_image || photos[0] || myProfile.profile_image;
  const specialties = (myProfile.specialties || []).join(' · ');
  const area = (myProfile.neighborhoods || []).join(', ');
  const packages = myProfile.pricing_tiers || [];
  const blackouts = myProfile.blackout_dates || [];
  const live = myProfile.status === 'approved';

  const rows = [
    {
      to: '/edit-profile',
      label: 'Portfolio',
      value: photos.length ? `${photos.length} photos` : 'No photos yet',
    },
    {
      to: '/edit-profile',
      label: 'About',
      value: myProfile.bio ? myProfile.bio.slice(0, 70) : 'Not added yet',
    },
    { to: '/edit-profile', label: 'Specialties', value: specialties || 'Not added yet' },
    { to: '/edit-profile', label: 'Service area', value: area || 'Not added yet' },
    {
      to: '/edit-profile',
      label: 'Packages',
      value: packages.length ? `${packages.length} package${packages.length > 1 ? 's' : ''}` : 'None yet',
    },
    {
      to: '/lensman-dashboard/calendar',
      label: 'Availability',
      value: blackouts.length ? `${blackouts.length} days unavailable` : 'Available every day',
    },
  ];

  return (
    <div className="arch-tab arch-tab--profile">
      <h1 className="wk-h1">Profile</h1>
      <p className="wk-lede">
        Your public profile. Clients see it at getstelli.com/creators/{myProfile.slug || 'you'}.
      </p>

      <div className="wk-card mt-5 overflow-hidden">
        {cover && (
          <div className="h-[132px] w-full overflow-hidden">
            <img src={cover} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[21px] font-extrabold leading-tight tracking-tight text-ink">
                {myProfile.display_name}
              </p>
              <p className="mt-1 text-[12.5px] wk-grey">
                {metrics.views} views · {myProfile.review_count || 0} reviews
              </p>
            </div>
            <span className={`wk-chip shrink-0 ${live ? 'wk-chip--lime' : 'wk-chip--cyan'}`}>
              {myProfile.under_review ? 'Under review' : live ? 'Live' : 'In review'}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CopyLinkPill creator={myProfile} />
            <Link
              to={`/creators/${myProfile.slug || myProfile.id}`}
              target="_blank"
              className="wk-btn wk-btn--ghost"
            >
              View page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-2.5">
        <ProfilePerformance profile={myProfile} />
      </div>

      <div className="wk-list mt-2.5">
        {rows.map((row) => (
          <Row key={row.label} {...row} />
        ))}
      </div>

      <PhotoReleases role="lensman" user={user} />
    </div>
  );
}