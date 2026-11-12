import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil } from 'lucide-react';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';

/** Who the client meets first: the face, the name, the link, and the two things you do with them. */
export default function StorefrontCard({ profile, views = 0 }) {
  const photos = profile.portfolio_images || [];
  const face = profile.profile_image || profile.cover_image || photos[0];
  const live = profile.status === 'approved';
  const state = profile.under_review ? 'Under review' : live ? 'Live' : 'In review';
  const initial = (profile.display_name || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="wk-card overflow-hidden">
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-start gap-4">
          <span className="grid h-[92px] w-[92px] shrink-0 place-items-center overflow-hidden rounded-[28px] bg-ink">
            {face ? (
              <img src={face} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[30px] font-extrabold text-white/60">{initial}</span>
            )}
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-[22px] font-extrabold leading-tight tracking-tight text-ink">
              {profile.display_name}
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.12em] ${
                live ? 'bg-neon-lime text-ink' : 'bg-ink/10 text-ink/55'
              }`}
            >
              {state}
            </span>
            <p className="mt-2 truncate text-[12.5px] wk-grey">
              getstelli.com/creators/{profile.slug || 'you'}
            </p>
            <p className="mt-1 text-[12.5px] wk-grey">
              {views} views · {profile.review_count || 0} reviews
            </p>
          </div>
        </div>

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