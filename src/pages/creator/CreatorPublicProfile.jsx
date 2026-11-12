import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import PhotoReleases from '@/components/dashboard/PhotoReleases';

function Row({ to, label, value }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.05]"
    >
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] font-medium text-white">{label}</b>
        <small className="mt-0.5 block truncate text-[12.5px] text-white/45">{value}</small>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" strokeWidth={2.4} />
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

  // Each row opens the editor on that one section: change it, save, back here.
  const rows = [
    {
      to: '/edit-profile?step=you',
      label: 'Photo & name',
      value: myProfile.display_name || 'Not set',
    },
    {
      to: '/edit-profile?step=pf',
      label: 'Portfolio',
      value: photos.length ? `${photos.length} photos` : 'No photos yet',
    },
    {
      to: '/edit-profile?step=bio',
      label: 'Bio & story',
      value: myProfile.bio ? myProfile.bio.slice(0, 70) : 'Nothing written yet',
    },
    { to: '/edit-profile?step=work', label: 'Specialties', value: specialties || 'None picked' },
    { to: '/edit-profile?step=work', label: 'Service area', value: area || 'Anywhere on campus' },
    { to: '/edit-profile?step=look', label: 'How your photos hang', value: 'Layout, frames and accent' },
    {
      to: '/edit-profile?step=price',
      label: 'Packages',
      value: packages.length ? `${packages.length} package${packages.length > 1 ? 's' : ''}` : 'None yet',
    },
    {
      to: '/lensman-dashboard/calendar',
      label: 'Availability',
      value: blackouts.length ? `${blackouts.length} days off` : 'Open every day',
    },
  ];

  return (
    <div>
      <h1 className="font-display text-[30px] font-medium leading-tight text-white">Public profile</h1>
      <p className="mt-1.5 text-[14px] leading-snug text-white/50">
        This page is your storefront. Clients see it at getstelli.com/creators/{myProfile.slug || 'you'}.
      </p>

      <div className="glass mt-5 overflow-hidden rounded-[26px]">
        {cover && (
          <div className="h-[132px] w-full overflow-hidden">
            <img src={cover} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-[22px] leading-tight text-white">
                {myProfile.display_name}
              </p>
              <p className="mt-1 text-[12.5px] text-white/45">
                {metrics.views} views · {myProfile.review_count || 0} reviews
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide"
              style={{
                background: live ? 'hsl(var(--neon-lime) / 0.16)' : 'hsl(var(--neon-cyan) / 0.14)',
                color: live ? 'hsl(var(--neon-lime))' : 'hsl(var(--neon-cyan))',
              }}
            >
              {myProfile.under_review ? 'UNDER REVIEW' : live ? 'LIVE' : 'IN REVIEW'}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CopyLinkPill creator={myProfile} />
            <Link
              to={`/creators/${myProfile.slug || myProfile.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-[13px] font-medium text-white/70 hover:text-white"
            >
              View page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="glass mt-3 overflow-hidden rounded-[24px]">
        {rows.map((row, i) => (
          <div key={row.label} className={i ? 'border-t border-white/[0.08]' : ''}>
            <Row {...row} />
          </div>
        ))}
      </div>

      <PhotoReleases role="lensman" user={user} />
    </div>
  );
}