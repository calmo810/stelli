import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole, creatorEmail } from '../../shared/bookingAccess.ts';
import { notifyBoth } from '../../shared/notify.ts';
import { moneyTaken, photoAddBlocker, photoRemoveBlocker } from '../../shared/bookingRules.ts';
import { ensureAlbumToken, albumUrl } from '../../shared/albumAccess.ts';
import { logAdminAction } from '../../shared/audit.ts';
import {
  MAX_DELIVERY_PHOTOS,
  MAX_PHOTOS_PER_UPLOAD,
  deliveryPhotoRows,
  signDeliveryFile,
  signedDeliveryPhotos,
} from '../../shared/deliveryPhotos.ts';

/**
 * The creator's photo hand-off: they upload straight to the booking from inside
 * the portal, and the client opens them in their memory album.
 *
 *   list   — the booking's photos with signed links (either side of the booking)
 *   link   — the album link with its key, to copy (either side of the booking)
 *   add    — the creator files newly uploaded photos against the booking
 *   remove — the creator takes one back, until the final edits are delivered
 *   notify — the creator emails the client the album link (once per 10 minutes)
 *
 * Once the final edits are delivered the album is locked: the creator can no
 * longer add to it or take photos out of it. What the client was handed, and
 * had 48 hours to check, stays what they have. A founder can still remove a
 * photo if one has to come down.
 */
const NOTIFY_GAP_MS = 10 * 60 * 1000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : '';
    const action = body.action || 'list';
    if (!bookingId) return Response.json({ error: 'A booking is required.' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking
      .get(bookingId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const role = viewerRole(booking, user);
    if (!role && user.role !== 'admin') {
      return Response.json({ error: 'This shoot is not yours.' }, { status: 403 });
    }

    if (action === 'list') {
      return Response.json({ photos: await signedDeliveryPhotos(base44, bookingId) });
    }

    // The link either side can hand out: it carries the album key, so it opens
    // for a client clicking it in an inbox with no Stelli account.
    if (action === 'link') {
      const token = await ensureAlbumToken(base44, booking);
      return Response.json({ url: albumUrl(bookingId, token) });
    }

    const isCreator = role === 'lensman' || user.role === 'admin';
    if (!isCreator) {
      return Response.json({ error: 'Only the booked creator can change these photos.' }, { status: 403 });
    }

    if (action === 'remove') {
      const photoId = typeof body.photoId === 'string' ? body.photoId : '';
      if (!photoId) return Response.json({ error: 'Which photo?' }, { status: 400 });

      const locked = user.role === 'admin' ? '' : photoRemoveBlocker(booking);
      if (locked) return Response.json({ error: locked }, { status: 409 });

      const photo = await base44.asServiceRole.entities.DeliveryPhoto
        .get(photoId)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!photo || photo.booking_id !== bookingId) {
        return Response.json({ error: 'That photo is not on this shoot.' }, { status: 404 });
      }

      await base44.asServiceRole.entities.DeliveryPhoto.delete(photoId);
      if (role !== 'lensman') {
        await logAdminAction(base44, user, {
          action: 'remove_photo',
          summary: `Removed a photo from ${booking.client_name || 'a client'}'s ${booking.event_date} album.`,
          bookingId,
          lensmanId: booking.lensman_id || '',
          details: { photoId, name: photo.name || '' },
        });
      }
      return Response.json({ removed: photoId });
    }

    // Photos land in the album silently. The client is emailed only when the
    // creator has looked at the album and pressed send.
    if (action === 'notify') {
      if (booking.status === 'cancelled' || !moneyTaken(booking)) {
        return Response.json({ error: 'Photos can go to the client once the shoot is paid for.' }, { status: 409 });
      }
      // One email per few minutes, so a double tap or an impatient resend
      // doesn't fill the client's inbox.
      const last = Date.parse(booking.album_notified_at || '') || 0;
      if (Date.now() - last < NOTIFY_GAP_MS) {
        return Response.json({ sent: true, alreadySent: true, url: albumUrl(bookingId, booking.album_token || '') });
      }
      const filed = await deliveryPhotoRows(base44, bookingId);
      if (!filed.length && !booking.delivery_link) {
        return Response.json({ error: 'Add the photos first.' }, { status: 400 });
      }
      if (!booking.client_email) {
        return Response.json({ error: 'This shoot has no client email.' }, { status: 400 });
      }

      const token = await ensureAlbumToken(base44, booking);
      if (!token) return Response.json({ error: 'The album link could not be made.' }, { status: 500 });
      const url = albumUrl(bookingId, token);
      const count = filed.length || 0;

      await base44.asServiceRole.entities.Booking.update(bookingId, { album_notified_at: new Date().toISOString() });
      await notifyBoth(
        base44,
        [booking.client_email],
        'New photos from your shoot',
        `${booking.lensman_name || 'Your creator'} added ${
          count ? `${count} photo${count === 1 ? '' : 's'}` : 'your photos'
        } to your ${booking.event_date} shoot.\n\nOpen your album: ${url}`
      );

      // The client's address is not handed back: it is the founders' to see.
      return Response.json({ sent: true, url });
    }

    if (action !== 'add') {
      return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }

    // Paid, not cancelled, and not yet finally delivered.
    const addBlocker = photoAddBlocker(booking);
    if (addBlocker) return Response.json({ error: addBlocker }, { status: 409 });

    const incoming = Array.isArray(body.files) ? body.files.slice(0, MAX_PHOTOS_PER_UPLOAD) : [];
    const cleaned = incoming
      .filter((file) => typeof file?.file_uri === 'string' && file.file_uri.trim())
      .map((file) => ({
        file_uri: file.file_uri.trim(),
        name: String(file.name || 'Photo').slice(0, 80),
      }));
    if (!cleaned.length) return Response.json({ error: 'Pick at least one photo.' }, { status: 400 });

    const existing = await deliveryPhotoRows(base44, bookingId);
    const room = MAX_DELIVERY_PHOTOS - existing.length;
    if (room <= 0) {
      return Response.json(
        { error: `This shoot already holds its ${MAX_DELIVERY_PHOTOS} photos.` },
        { status: 400 }
      );
    }

    // Only files that this app can actually read back are filed, so a stale or
    // foreign path can never leave a broken tile in the client's album.
    const rows = [];
    let position = existing.length;
    for (const file of cleaned.slice(0, room)) {
      const readable = await signDeliveryFile(base44, file.file_uri).catch(() => '');
      if (!readable) continue;
      rows.push({
        booking_id: bookingId,
        creator_id: booking.creator_id || '',
        creator_email: creatorEmail(booking),
        client_id: booking.client_id || '',
        client_email: booking.client_email || '',
        file_uri: file.file_uri,
        name: file.name,
        position: position++,
      });
    }

    if (!rows.length) {
      return Response.json({ error: 'Those photos did not upload. Try again.' }, { status: 400 });
    }

    await base44.asServiceRole.entities.DeliveryPhoto.bulkCreate(rows);

    return Response.json({
      added: rows.length,
      photos: await signedDeliveryPhotos(base44, bookingId),
    });
  } catch (error) {
    console.error('deliveryPhotos error:', error.message);
    return Response.json({ error: 'The photos could not be updated. Try again.' }, { status: 500 });
  }
}