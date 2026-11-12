import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil } from 'lucide-react';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import { displayNameOf, profilePath, profileUrlLabel } from '@/lib/creatorProfile';

/** Where the page stands, in the creator's words. */
export function storefrontState(profile) {
  if (profile.under_review) return { label: 'On hold', live: false, note: 'A founder is reviewing your page. Clients can’t see it right now.' };
  if (profile.status === 'approved') return { label: 'Live', live: true, note: '' };
  if (profile.status === 'rejected') return { label: 'Not approved', live: false, note: 'Your page was not approved, so clients can’t see it.' };
  return { label: 'In review', live: false, note: 'Stelli is reviewing your page. It goes live the moment you’re approved.' };
}

/** Who the client meets first, as one band: the face, the name, the link, and what you do with them. */
export default function StorefrontCard({ profile }) {
  const photos = profile.portfolio_images || [];
  const face = profile.profile_image || profile.cover_image || photos[0];
  const state = storefrontState(profile);
  const name = displayNameOf(profile);

  return (
    <div className="wk-card px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="grid h-[78px] w-[78px] shrink-0 place-items-center overflow-hidden rounded-[26px] bg-ink">
          {face ? (
            <img src={face} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[26px] font-extrabold text-fg-2">{name.charAt(0).toUpperCase()}</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[21px] font-extrabold leading-tight tracking-tight text-ink">{name}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.12em] ${
                state.live ? 'bg-neon-lime text-ink' : 'bg-ink/10 text-ink/70'
              }`}
            >
              {state.label}
            </span>
          </div>
          <p className="mt-1 truncate text-[12.5px] wk-grey">{profileUrlLabel(profile)}</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Link to="/edit-profile" className="wk-btn wk-btn--ink">
            Edit profile <Pencil className="h-3.5 w-3.5" aria-hidden />
          </Link>
          {state.live && <CopyLinkPill creator={profile} />}
          <Link to={profilePath(profile)} className="wk-btn wk-btn--ghost">
            {state.live ? 'View page' : 'Preview page'} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      {state.note && <p className="mt-3 border-t border-black/10 pt-3 text-[13px] leading-snug wk-grey">{state.note}</p>}
    </div>
  );
}
