/**
 * Gets a photo ready to upload.
 *
 * Two things go wrong with photos straight off a camera or a phone: they are
 * huge (a 25 MB file takes a minute to upload on campus wifi), and iPhone HEIC
 * files upload fine and then show as a broken image in most browsers. So a
 * large photo is scaled to a size that still looks sharp on a page, and a HEIC
 * is turned into a JPG when this browser can read it — and refused, with a
 * clear reason, when it can't.
 */

const MAX_EDGE = 2400;
const BIG_FILE = 1.5 * 1024 * 1024;
const HEIC_NAME = /\.(heic|heif)$/i;

export class ImageProblem extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/** What to tell the creator when a photo can't be used. */
export function imageProblemMessage(error) {
  if (error?.code === 'heic') {
    return "That's an iPhone HEIC photo, which most browsers can't show. Save it as a JPG and add it again.";
  }
  if (error?.code === 'not-image') return 'That file is not a photo.';
  return 'That photo could not be uploaded. Try again.';
}

const isHeic = (file) => /hei[cf]/i.test(file.type || '') || HEIC_NAME.test(file.name || '');

function toJpeg(bitmap, scale) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  // A transparent PNG would otherwise come out with a black background.
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}

/** Returns the file to upload: the original, or a lighter JPG of it. */
export async function prepareImage(file) {
  const heic = isHeic(file);
  const type = file?.type || '';
  if (!heic && (!type.startsWith('image/') || type === 'image/svg+xml')) throw new ImageProblem('not-image');
  if (type === 'image/gif') return file;

  let bitmap = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // This browser can't read it. Fine for a normal photo (upload it as it
    // is); not fine for a HEIC, which nobody would then be able to see.
    if (heic) throw new ImageProblem('heic');
    return file;
  }

  try {
    const longEdge = Math.max(bitmap.width, bitmap.height);
    if (!heic && longEdge <= MAX_EDGE && file.size <= BIG_FILE) return file;

    const blob = await toJpeg(bitmap, Math.min(1, MAX_EDGE / longEdge));
    if (!blob) {
      if (heic) throw new ImageProblem('heic');
      return file;
    }
    // Never swap a photo for a heavier copy of itself.
    if (!heic && blob.size >= file.size) return file;

    const name = `${String(file.name || 'photo').replace(/\.[^.]+$/, '')}.jpg`;
    return new File([blob], name, { type: 'image/jpeg' });
  } finally {
    bitmap.close?.();
  }
}
