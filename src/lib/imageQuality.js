/**
 * Client-side image checks. Dimensions are read in the browser before upload —
 * no image processing happens anywhere.
 */

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MIN_LONG_EDGE = 2000;
export const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp';

export const COVER_TOO_SMALL =
  'Your cover needs to be at least 2000 px on the long side so it looks sharp full-width — try the original file, not a download from Instagram.';

export const SOFT_SIZE_WARNING = "This one's a bit small and may look soft on large screens";

export function fileProblem(file) {
  if (!file) return 'That file could not be read.';
  if (file.size > MAX_FILE_BYTES) return 'That file is over 25 MB — upload a smaller version.';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'Use a JPG, PNG or WebP file.';
  }
  return null;
}

function measure(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = src;
  });
}

export async function readImageSize(file) {
  const url = URL.createObjectURL(file);
  try {
    return await measure(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function measureUrl(url) {
  return measure(url);
}

export function isTooSmall(size) {
  if (!size) return false;
  return Math.max(size.width || 0, size.height || 0) < MIN_LONG_EDGE;
}

export function coverSizeError(size) {
  return isTooSmall(size) ? COVER_TOO_SMALL : null;
}

export function softSizeWarning(size) {
  return isTooSmall(size) ? SOFT_SIZE_WARNING : null;
}