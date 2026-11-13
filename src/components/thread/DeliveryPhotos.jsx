import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Copy, Eye, ImagePlus, Images, Loader2, Send, X } from 'lucide-react';
import Pill from '@/components/shared/Pill';

/**
 * The creator's photo hand-off, inside the shoot's delivery section: photos
 * upload straight to the booking (stored privately) and open in the client's
 * album the moment they land.
 */
export default function DeliveryPhotos({ booking, role, onChanged }) {
  const inputRef = useRef(null);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const isCreator = role === 'lensman';
  // Once the final edits are delivered the album is locked: no adding, no removing.
  const locked = Boolean(booking?.delivered_at);
  const canEdit = isCreator && !locked;

  const clientFirst = (booking?.client_name || '').trim().split(' ')[0] || 'your client';

  // The album exactly as the client will see it, reached through the same
  // keyed link the email carries.
  const { data: albumLink = '' } = useQuery({
    queryKey: ['album-link', booking?.id],
    enabled: isCreator && !!booking?.id,
    queryFn: async () => {
      const response = await base44.functions.invoke('deliveryPhotos', {
        bookingId: booking.id,
        action: 'link',
      });
      return response.data?.url || '';
    },
  });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['delivery-photos', booking?.id],
    enabled: !!booking?.id,
    queryFn: async () => {
      const response = await base44.functions.invoke('deliveryPhotos', {
        bookingId: booking.id,
        action: 'list',
      });
      return response.data?.photos || [];
    },
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['delivery-photos', booking.id] });
    onChanged?.();
  };

  const pick = async (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    event.target.value = '';
    if (!files.length) {
      setError('Those were not photos.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading ${i + 1} of ${files.length}`);
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: files[i] });
        if (file_uri) uploaded.push({ file_uri, name: files[i].name });
      }
      if (!uploaded.length) throw new Error('Those photos did not upload.');

      const response = await base44.functions.invoke('deliveryPhotos', {
        bookingId: booking.id,
        action: 'add',
        files: uploaded,
      });
      if (response.data?.error) throw new Error(response.data.error);
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Those photos did not upload.');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const remove = async (photoId) => {
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('deliveryPhotos', {
        bookingId: booking.id,
        action: 'remove',
        photoId,
      });
      if (response.data?.error) throw new Error(response.data.error);
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'That photo did not come off.');
    } finally {
      setBusy(false);
    }
  };

  // The gallery link carries the album's key, so it opens for a client who is
  // not signed in — the link in an inbox is the only way most of them arrive.
  const copyAlbumLink = async () => {
    setError('');
    try {
      const response = await base44.functions.invoke('deliveryPhotos', {
        bookingId: booking.id,
        action: 'link',
      });
      const url = response.data?.url;
      if (!url) throw new Error('That link did not come through.');
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        window.prompt('Copy the gallery link', url);
      }
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2400);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'That link did not come through.');
    }
  };

  // The one moment the client hears about the album: an explicit send.
  const sendAlbum = async () => {
    setSending(true);
    setError('');
    try {
      const response = await base44.functions.invoke('deliveryPhotos', {
        bookingId: booking.id,
        action: 'notify',
      });
      if (response.data?.error) throw new Error(response.data.error);
      setSent(true);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'That email did not go out.');
    } finally {
      setSending(false);
    }
  };

  // A client with nothing delivered yet does not need an empty gallery.
  if (!isCreator && !isLoading && !photos.length) return null;

  return (
    <div
      className="mt-4 rounded-2xl p-4"
      style={{ background: 'var(--fill)', border: '1px solid var(--line)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-fg-3">
          {isCreator ? 'PHOTOS FOR YOUR CLIENT' : `YOUR PHOTOS${photos.length ? ` · ${photos.length}` : ''}`}
        </p>
        {!isCreator && photos.length > 0 && <Images className="h-4 w-4 shrink-0 text-fg-3" />}
      </div>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl">
              <a href={photo.url} target="_blank" rel="noreferrer" className="block">
                <img
                  src={photo.url}
                  alt={photo.name || 'Delivered photo'}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </a>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => remove(photo.id)}
                  disabled={busy}
                  aria-label="Remove photo"
                  className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-fg-2 backdrop-blur-sm transition-colors hover:text-fg disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isCreator && locked && (
        <p className="mt-3 text-[12px] leading-relaxed text-fg-3">
          Delivered. The album is locked so your client keeps exactly what you sent.
        </p>
      )}

      {canEdit && (
        <div className="mt-3 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={pick}
          />
          <Pill
            as="button"
            type="button"
            tone="lime"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-full py-3.5"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {busy ? progress || 'Uploading…' : photos.length ? 'Add more photos' : 'Upload photos'}
          </Pill>
          {photos.length > 0 && (
            <>
              <Pill
                as="button"
                type="button"
                tone="cyan"
                onClick={sendAlbum}
                disabled={busy || sending || sent}
                className="w-full py-3.5"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : sent ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sent ? `Sent to ${clientFirst}` : `Email ${clientFirst} the album`}
              </Pill>
              <div className="flex gap-2">
                {albumLink && (
                  <a
                    href={albumLink}
                    target="_blank"
                    rel="noreferrer"
                    className="st-card flex flex-1 items-center justify-center gap-2 rounded-[980px] px-4 py-3 text-[14px] font-semibold text-fg transition-transform active:scale-[0.96]"
                  >
                    <Eye className="h-4 w-4" /> Preview album
                  </a>
                )}
                <Pill as="button" type="button" tone="soft" onClick={copyAlbumLink} className="flex-1 py-3">
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {linkCopied ? 'Copied' : 'Copy link'}
                </Pill>
              </div>
            </>
          )}
          <p className="text-center text-[11px] text-fg-3">
            Photos save to the album first. {clientFirst} is not emailed until you send. Up to 20 at a time.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-[13px]" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}