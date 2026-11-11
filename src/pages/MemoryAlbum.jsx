import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Images, KeyRound } from 'lucide-react';
import AlbumCover from '@/components/album/AlbumCover';
import AlbumGrid from '@/components/album/AlbumGrid';
import AlbumViewer from '@/components/album/AlbumViewer';
import { safeHref } from '@/lib/safeHref';

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-[18px] bg-white/[0.06]" />
      ))}
    </div>
  );
}

/** The lock panel: the gallery is real, the visitor just cannot prove they were invited. */
function Locked() {
  return (
    <div className="glass rounded-[26px] p-7 text-center sm:p-10">
      <KeyRound className="mx-auto h-6 w-6 text-white/40" />
      <p className="mt-4 text-[15px] font-semibold text-white">This link is missing its key</p>
      <p className="mx-auto mt-2 max-w-[38ch] text-[13px] leading-relaxed text-white/50">
        Album links only open with the code at the end of them. Ask your creator to send the link
        again, or sign in with the email you booked with.
      </p>
      <button
        type="button"
        onClick={() => base44.auth.redirectToLogin(window.location.href)}
        className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold"
        style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
      >
        Sign in
      </button>
    </div>
  );
}

export default function MemoryAlbum() {
  const { bookingId } = useParams();
  const queryClient = useQueryClient();
  const [openIndex, setOpenIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetNote, setResetNote] = useState('');

  // The album is unlocked by the token in the link, not by the booking ID alone.
  const token = new URLSearchParams(window.location.search).get('t') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['album-booking', bookingId, token],
    retry: false,
    // Photo links are signed and expire, so a tab left open re-signs on its own.
    refetchInterval: 40 * 60 * 1000,
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getAlbumBooking', { bookingId, token });
        if (response.data?.error) return { locked: true };
        return {
          booking: response.data?.booking || null,
          photos: response.data?.photos || [],
          canResetLink: Boolean(response.data?.canResetLink),
        };
      } catch {
        return { locked: true };
      }
    },
  });

  const booking = data?.booking || null;
  const photos = data?.photos || [];
  const locked = Boolean(data?.locked);

  useEffect(() => {
    if (!booking) return;
    document.title = `${booking.lensman_name ? `${booking.lensman_name} · ` : ''}Your photos · Stelli`;
  }, [booking]);

  // The link only opens with its token. A guest already has theirs in the URL.
  const shareToken = booking?.album_token || token;
  const shareLink = shareToken
    ? `${window.location.origin}/album/${bookingId}?t=${shareToken}`
    : `${window.location.origin}/album/${bookingId}`;

  // The client can cut off a link that has gone somewhere it shouldn't.
  const resetLink = async () => {
    const sure = window.confirm(
      'Reset the album link? The link you shared before will stop working for everyone. You will get a new one to share.'
    );
    if (!sure) return;
    setResetting(true);
    setResetNote('');
    try {
      const response = await base44.functions.invoke('resetAlbumLink', { bookingId });
      const fresh = response.data?.album_token;
      if (!fresh) throw new Error(response.data?.error || 'The link could not be reset.');
      window.history.replaceState({}, '', `/album/${bookingId}?t=${fresh}`);
      await queryClient.invalidateQueries({ queryKey: ['album-booking', bookingId] });
      setResetNote('Done. The old link no longer works. Share the new one below.');
    } catch (e) {
      setResetNote(e?.response?.data?.error || e.message || 'The link could not be reset. Try again.');
    } finally {
      setResetting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {
      window.prompt('Copy your album link', shareLink);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const galleryHref = safeHref(booking?.delivery_link);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-20 pt-2 md:px-8 md:pt-4">
      {locked ? (
        <Locked />
      ) : (
        <>
          <AlbumCover booking={booking} cover={photos[0]} count={photos.length} />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-white/45">
              {photos.length
                ? `${photos.length} photo${photos.length === 1 ? '' : 's'} · tap any one to open it`
                : 'Your photos will land here'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {galleryHref && (
                <a
                  href={galleryHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold"
                  style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Full gallery
                </a>
              )}
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-[12.5px] font-semibold text-white/75 transition-colors hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Link copied' : 'Share album'}
              </button>
            </div>
            {data?.canResetLink && (
              <div className="w-full">
                <button
                  type="button"
                  onClick={resetLink}
                  disabled={resetting}
                  className="font-body text-[12px] text-white/50 underline underline-offset-4 transition-colors hover:text-white disabled:opacity-50"
                >
                  {resetting ? 'Resetting…' : 'Reset this link'}
                </button>
                <p className="mt-1.5 font-body text-[11px] leading-relaxed text-white/35">
                  Anyone with the link can see this album. If it has gone somewhere it shouldn’t, reset it and the old link stops working.
                </p>
                {resetNote && <p className="mt-2 font-body text-[12px] text-white/70">{resetNote}</p>}
              </div>
            )}
          </div>

          <div className="mt-4">
            {isLoading ? (
              <Skeleton />
            ) : photos.length ? (
              <AlbumGrid photos={photos} onOpen={setOpenIndex} />
            ) : (
              <div className="glass rounded-[26px] p-8 text-center">
                <Images className="mx-auto h-6 w-6 text-white/35" />
                <p className="mx-auto mt-4 max-w-[36ch] text-[13px] leading-relaxed text-white/50">
                  Nothing in your album yet. The moment your creator hands over the photos, they
                  appear right here.
                </p>
              </div>
            )}
          </div>

          {photos.length > 0 && (
            <p className="mt-6 text-center text-[11.5px] text-white/30">
              Anyone with this link can see these photos. The client can reset it at any time.
            </p>
          )}
        </>
      )}

      {openIndex !== null && photos.length > 0 && (
        <AlbumViewer
          photos={photos}
          index={openIndex}
          onIndex={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}