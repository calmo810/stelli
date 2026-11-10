import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ExternalLink, Copy, Check, ImageOff } from 'lucide-react';
import { safeHref } from '@/lib/safeHref';

export default function MemoryAlbum() {
  const { bookingId } = useParams();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetNote, setResetNote] = useState('');

  // The album is unlocked by the token in the link, not by the booking ID alone.
  const token = new URLSearchParams(window.location.search).get('t') || '';

  const { data: album, isLoading } = useQuery({
    queryKey: ['album-booking', bookingId, token],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAlbumBooking', { bookingId, token });
      return {
        booking: response.data?.booking || null,
        photos: response.data?.photos || [],
        canResetLink: Boolean(response.data?.canResetLink),
      };
    },
    retry: false,
  });

  const booking = album?.booking || null;
  const photos = album?.photos || [];

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

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deliveredLabel = booking?.delivered_at
    ? new Date(booking.delivered_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const title = booking
    ? `${booking.event_type?.replace(/_/g, ' ') || 'Your shoot'} · ${booking.event_date ? new Date(booking.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}`
    : 'Your gallery';

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="label-mono text-[9px] text-white/35 mb-4">Memory Album</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold mb-4 capitalize text-white">
            {title}
          </h1>
          <p className="font-body text-[13px] mb-12 text-white/50">
            {booking?.lensman_name ? `Delivered by ${booking.lensman_name}` : 'Your creator'}
            {deliveredLabel ? ` · ${deliveredLabel}` : ''}
          </p>

          {isLoading ? (
            <div className="border border-white/10 p-10 text-center" style={{ borderRadius: 4 }}>
              <p className="font-body text-[13px] text-white/45">Loading your gallery…</p>
            </div>
          ) : (
            <>
              {photos.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group block overflow-hidden"
                        style={{ borderRadius: 4, background: 'hsl(var(--surface))' }}
                      >
                        <img
                          src={photo.url}
                          alt={photo.name || 'Delivered photo'}
                          loading="lazy"
                          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </a>
                    ))}
                  </div>
                  <p className="mt-3 font-body text-[11px] text-white/35">
                    {photos.length} photo{photos.length === 1 ? '' : 's'} · tap one to open it full size.
                  </p>
                </>
              )}

              {booking?.delivery_link ? (
                <a
                  href={safeHref(booking.delivery_link)}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center gap-3 w-full py-5 label-mono text-[11px] font-semibold transition-transform hover:-translate-y-0.5 ${
                    photos.length ? 'mt-6' : ''
                  }`}
                  style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
                >
                  <ExternalLink className="w-4 h-4" /> {photos.length ? 'Open the full gallery' : 'Open your gallery'}
                </a>
              ) : !photos.length ? (
                <div className="border border-white/10 p-10 text-center" style={{ borderRadius: 4 }}>
                  <ImageOff className="w-6 h-6 mx-auto mb-4 text-white/30" />
                  <p className="font-body text-[13px] text-white/50">
                    Your photos aren't up yet. We'll email you the moment your creator delivers them.
                  </p>
                </div>
              ) : null}
            </>
          )}

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="label-mono text-[9px] text-white/35 mb-3">Share this album</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 font-body text-[12px] truncate text-white/50" style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}>
                {shareLink}
              </div>
              <button
                onClick={copyLink}
                aria-label="Copy album link"
                className="flex items-center gap-1.5 px-4 py-3 font-body text-[12px] font-medium shrink-0"
                style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {album?.canResetLink && (
              <div className="mt-4">
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
        </motion.div>
      </div>
    </div>
  );
}