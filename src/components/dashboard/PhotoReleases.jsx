import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { base44, errorMessage } from '@/api/base44Client';
import { shortDate } from '@/lib/format';

const MAX_PHOTOS = 6;

const shootName = (r) => (r.event_type ? r.event_type.replace(/_/g, ' ') : 'shoot');

function statusText(r, role) {
  const mine = role === 'client' ? r.client_decision : r.creator_decision;
  const theirs = role === 'client' ? r.creator_decision : r.client_decision;
  const other = role === 'client' ? r.lensman_name || 'your creator' : (r.client_name || 'your client').split(' ')[0];
  if (mine === 'declined') return 'You kept this shoot private.';
  if (theirs === 'declined') return `${other} kept this shoot private.`;
  if (mine === 'approved' && theirs === 'approved') return 'Shared on the profile. You can take it down any time.';
  if (mine === 'approved') return `You said yes. Waiting on ${other}.`;
  return null;
}

/** The creator picks which photos from the shoot would be shown. */
function PhotoPicker({ photos, setPhotos }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const add = async (files) => {
    setBusy(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const urls = [];
      for (const file of [...files].slice(0, room)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) urls.push(file_url);
      }
      setPhotos([...photos, ...urls]);
    } finally {
      setBusy(false);
    }
  };
  const addTile = 'border-line-2 text-fg-3 hover:border-[var(--fg)] hover:text-fg';
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {photos.map((src) => (
        <div key={src} className="relative h-[72px] w-[58px] overflow-hidden rounded-lg">
          <img src={src} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Remove photo"
            onClick={() => setPhotos(photos.filter((p) => p !== src))}
            className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/65 text-white"
          >
            <X className="h-3 w-3" strokeWidth={2.6} />
          </button>
        </div>
      ))}
      {photos.length < MAX_PHOTOS && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={`grid h-[72px] w-[58px] place-items-center rounded-lg border border-dashed transition-colors ${addTile}`}
          aria-label="Add photos from this shoot"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files?.length && add(e.target.files)} />
    </div>
  );
}

function ReleaseCard({ release: r, role }) {
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState(r.photos || []);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const mine = role === 'client' ? r.client_decision : r.creator_decision;
  const pending = !mine || mine === 'pending';
  const status = statusText(r, role);
  const other = role === 'client' ? r.lensman_name || 'your creator' : (r.client_name || 'your client').split(' ')[0];
  // A client can't say yes to photos that haven't been chosen.
  const waitingOnPhotos = role === 'client' && !(r.photos || []).length;

  // A question waiting on you is a colour block; a settled one is a plain card.
  const shell = `st-card ${pending ? 'st-card--lilac' : ''} px-4 py-4 sm:px-5`;
  const heading = 'text-fg';
  const meta = 'text-fg-3';
  const body = 'text-fg-2';
  const fine = 'text-fg-3';
  const plain = 'inline-flex min-h-[40px] items-center text-fg-3 hover:text-fg';
  const yes = 'inline-flex min-h-[40px] items-center text-accent2 hover:underline';

  const answer = async (decision) => {
    setSaving(decision);
    setError('');
    try {
      const res = await base44.functions.invoke('respondPhotoRelease', {
        releaseId: r.id,
        decision,
        ...(role === 'lensman' ? { photos } : {}),
      });
      if (res.data?.error) throw new Error(res.data.error);
      await queryClient.invalidateQueries({ queryKey: ['photo-releases'] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className={shell}>
      <b className={`block text-[15px] font-bold first-letter:uppercase ${heading}`}>
        {pending ? `Share your ${shootName(r)} on Stelli?` : `${shootName(r)} · photo release`}
      </b>
      <small className={`mt-0.5 block text-[13px] ${meta}`}>
        {[shortDate(r.event_date), role === 'client' ? r.lensman_name : r.client_name].filter(Boolean).join(' · ')}
      </small>

      {pending ? (
        <>
          <p className={`mt-2.5 text-[13.5px] leading-relaxed ${body}`}>
            {role === 'client'
              ? `Can this shoot appear under Past Stelli shoots on ${other}'s page? These photos and your review would show publicly, with your first name only. If ${other} changes the photos, you are asked again.`
              : `Can this shoot appear under Past Stelli shoots on your page? Pick up to ${MAX_PHOTOS} photos to show. ${other} is asked too.`}
          </p>
          {role === 'lensman' && <PhotoPicker photos={photos} setPhotos={setPhotos} />}
          {/* The client says yes to these exact photos, so they are shown. */}
          {role === 'client' && (r.photos || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.photos.map((src) => (
                <a key={src} href={src} target="_blank" rel="noreferrer" className="block h-[72px] w-[58px] overflow-hidden rounded-lg">
                  <img src={src} alt="A photo that would be shown" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
          {waitingOnPhotos && (
            <p className={`mt-2.5 text-[13px] ${body}`}>
              {other} hasn’t picked the photos yet. You can answer once you can see them.
            </p>
          )}
          <p className={`mt-2.5 text-[12px] ${fine}`}>Nothing shows unless you both say yes. Either of you can take it down later.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!!saving || (role === 'lensman' && !photos.length) || waitingOnPhotos}
              onClick={() => answer('approved')}
              className="st-btn st-btn--primary st-btn--sm flex-1"
            >
              {saving === 'approved' ? 'Saving…' : 'Yes, share it'}
            </button>
            <button
              type="button"
              disabled={!!saving}
              onClick={() => answer('declined')}
              className="st-btn st-btn--outline st-btn--sm flex-1"
            >
              {saving === 'declined' ? 'Saving…' : 'Keep private'}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className={`text-[13px] ${body}`}>{status}</p>
          {mine === 'approved' ? (
            <button type="button" disabled={!!saving} onClick={() => answer('declined')} className={`shrink-0 text-[12.5px] font-semibold ${plain}`}>
              {saving ? 'Saving…' : 'Take down'}
            </button>
          ) : (
            <button
              type="button"
              disabled={!!saving || (role === 'lensman' && !photos.length)}
              onClick={() => answer('approved')}
              className={`shrink-0 text-[12.5px] font-semibold disabled:opacity-40 ${yes}`}
            >
              {saving ? 'Saving…' : 'Share instead'}
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}

/**
 * Photo releases: a separate agreement for each delivered booking, asking
 * whether the shoot may appear on the creator's public page. Each side answers
 * from their own portal. Renders nothing when there are none.
 */
export default function PhotoReleases({ role, user, title = 'Photo releases' }) {
  const { data: releases = [] } = useQuery({
    queryKey: ['photo-releases', role, user?.id],
    enabled: !!user?.id,
    queryFn: () =>
      base44.entities.PhotoRelease.filter(
        role === 'client' ? { client_id: user.id } : { creator_id: user.id },
        '-created_date'
      ).catch(() => []),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const mineList = releases.filter((r) =>
    role === 'client'
      ? r.client_id === user.id
      : r.creator_id === user.id
  );
  if (!mineList.length) return null;

  const key = role === 'client' ? 'client_decision' : 'creator_decision';
  const sorted = [...mineList].sort((a, b) => (a[key] === 'pending' ? -1 : 0) - (b[key] === 'pending' ? -1 : 0));

  return (
    <section>
      <h2 className="st-kicker mb-2.5 pl-1">{title}</h2>
      <div className="space-y-2">
        {sorted.map((r) => (
          <ReleaseCard key={r.id} release={r} role={role} />
        ))}
      </div>
    </section>
  );
}