import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil } from 'lucide-react';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';

/** Who the client meets first, as one band: the face, the name, the link, and what you do with them. */
export default function StorefrontCard({ profile }) {
  const photos = profile.portfolio_images || [];
  const face = profile.profile_image || profile.cover_image || photos[0];
  const live = profile.status === 'approved';
  const state = profile.under_review ? 'Under review' : live ? 'Live' : 'In review';
  const initial = (profile.display_name || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="wk-card px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="grid h-[78px] w-[78px] shrink-0 place-items-center overflow-hidden rounded-[26px] bg-ink">
          {face ? (
            <img src={face} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[26px] font-extrabold text-white/60">{initial}</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[21px] font-extrabold leading-tight tracking-tight text-ink">
              {profile.display_name}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.12em] ${
                live ? 'bg-neon-lime text-ink' : 'bg-ink/10 text-ink/55'
              }`}
            >
              {state}
            </span>
          </div>
          <p className="mt-1 truncate text-[12.5px] wk-grey">
            getstelli.com/creators/{profile.slug || 'you'}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Link to="/edit-profile" className="wk-btn wk-btn--ink">
            Edit profile <Pencil className="h-3.5 w-3.5" />
          </Link>
          <CopyLinkPill creator={profile} />
          <Link
            to={`/creators/${profile.slug || profile.id}`}
            target="_blank"
            className="wk-btn wk-btn--ghost"
          >
            View page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}