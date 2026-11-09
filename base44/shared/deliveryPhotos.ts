/**
 * The photos a creator hands over inside the portal.
 *
 * Files live in private storage; a photo is only ever shown through a signed
 * link minted here, so the gallery opens for the booking's two people (and for
 * whoever holds the album token) and for nobody else.
 */
export const MAX_DELIVERY_PHOTOS = 120;
export const MAX_PHOTOS_PER_UPLOAD = 20;

/** Shoots whose money is in escrow and are past the quote stage. */
export const DELIVERABLE = ['confirmed', 'in_progress', 'awaiting_delivery', 'delivered', 'completed'];

/** Rows for a booking's photos, oldest upload first. */
export async function deliveryPhotoRows(base44, bookingId, limit = MAX_DELIVERY_PHOTOS) {
  const result = await base44.asServiceRole.entities.DeliveryPhoto
    .filter({ booking_id: bookingId }, 'position', limit)
    .catch(() => []);
  return Array.isArray(result) ? result : result?.items || [];
}

export async function signDeliveryFile(base44, fileUri) {
  const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
    file_uri: fileUri,
    expires_in: 3600,
  });
  return signed_url || '';
}

/**
 * The booking's photos with links the browser can open. Signing is done in
 * small batches so a full album never floods the worker.
 */
export async function signedDeliveryPhotos(base44, bookingId, limit = MAX_DELIVERY_PHOTOS) {
  const rows = await deliveryPhotoRows(base44, bookingId, limit);
  const photos = [];

  for (let i = 0; i < rows.length; i += 6) {
    const batch = await Promise.allSettled(
      rows.slice(i, i + 6).map(async (row) => ({
        id: row.id,
        name: row.name || '',
        url: await signDeliveryFile(base44, row.file_uri),
      }))
    );
    for (const item of batch) {
      if (item.status === 'fulfilled' && item.value?.url) photos.push(item.value);
    }
  }

  return photos;
}