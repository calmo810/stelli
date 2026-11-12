import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil } from 'lucide-react';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';

/** Who the client meets first: the face, the name, the link, and the two things you do with them. */
export default function StorefrontCard({ profile, views = 0 }) {
  const photos = profile.portfolio_images || [];
  const cover = profile.cover_image || photos[0] || profile.profile_image;
  const live = profile.status === 'approved';
  const state = profile.under_review ? 'Under review' : live ? 'Live' : 'In review';

  return (
    <div className="wk-card overflow-hidden">
      {cover && (
        <div className="relative h-[148px] w-full overflow-hidden">
          <img src={cover} alt="" className="h-full w-full object-cover" />
          <span
            className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.12em] ${
              live ? 'bg-neon-lime text-ink' : 'bg-ink text-white/80'
            }`}
          >
            {state}
          </span>
        </div>
      )}

      <div className="px-5 py-4">
        <p className="truncate text-[22px] font-extrabold leading-tight tracking-tight text-ink">
          {profile.display_name}
        </p>
        <p className="mt-1 truncate text-[12.5px] wk-grey">
          getstelli.com/creators/{profile.slug || 'you'}
        </p>
        <p className="mt-2 text-[12.5px] wk-grey">
          {views} views · {profile.review_count || 0} reviews
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
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