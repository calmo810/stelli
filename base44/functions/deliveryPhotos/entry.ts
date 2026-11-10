import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole, creatorEmail } from '../../shared/bookingAccess.ts';
import { notifyBoth } from '../../shared/notify.ts';
import { photoAddBlocker, photoRemoveBlocker } from '../../shared/bookingRules.ts';
import { newAlbumToken } from '../../shared/albumAccess.ts';
import { SITE_ORIGIN } from '../../shared/origins.ts';
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
 *   add    — the creator files newly uploaded photos against the booking
 *   remove — the creator takes one back, until the final edits are delivered
 *
 * Once the final edits are delivered the album is locked: the creator can no
 * longer add to it or take photos out of it. What the client was handed, and
 * had 48 hours to check, stays what they have. A founder can still remove a
 * photo if one has to come down.
 */
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

    // The first hand-off gets an email; later batches show up quietly, so a
    // creator uploading forty photos does not send forty notifications.
    if (!existing.length && booking.client_email) {
      // The link carries the album token, so it opens without signing in.
      const albumToken = booking.album_token || newAlbumToken();
      if (!booking.album_token) {
        await base44.asServiceRole.entities.Booking.update(bookingId, { album_token: albumToken });
      }
      await notifyBoth(
        base44,
        [booking.client_email],
        'New photos from your shoot',
        `${booking.lensman_name || 'Your creator'} added ${rows.length} photo${
          rows.length === 1 ? '' : 's'
        } to your ${booking.event_date} shoot.\n\nOpen your album: ${SITE_ORIGIN}/album/${booking.id}?t=${albumToken}`
      );
    }

    return Response.json({
      added: rows.length,
      photos: await signedDeliveryPhotos(base44, bookingId),
    });
  } catch (error) {
    console.error('deliveryPhotos error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}