import exifr from 'exifr';
import { t } from '../../i18n';

const MAX_SIDE = 800;
const QUALITY = 0.7;
// 10MB aligns with exifToGeojson.MAX_PHOTO_BYTES; iPhone 15 Pro HDR HEIC
// can exceed 5MB even when Finder reports 3-4MB (depth maps + motion photo).
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function compressImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(t('photo.tooLarge'));
  }

  // createImageBitmap decodes at the engine level — avoids expanding
  // full-resolution pixels (e.g. 48 MP) into the JS heap on iOS Safari.
  // Chrome/Firefox desktop can't decode HEIC; fall back to the EXIF-embedded
  // JPEG thumbnail (every iPhone HEIC carries one).
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // createImageBitmap can't decode — most commonly HEIC on Chrome/Firefox.
    // Two-tier fallback:
    //   1. HEIC → heic2any (dynamic import so the libheif WASM chunk only
    //      loads when a user actually imports HEIC)
    //   2. Anything else → EXIF thumbnail IFD
    const isHeic =
      /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type);

    if (isHeic) {
      try {
        // heic-to tracks current libheif (1.21.2+) and handles iPhone 15 Pro
        // iOS 18 HEIC variants that the older heic2any 0.0.4 rejected with
        // "ERR_LIBHEIF format not supported".
        const { heicTo } = await import('heic-to');
        const jpeg = await heicTo({
          blob: file,
          type: 'image/jpeg',
          quality: 0.8,
        });
        bitmap = await createImageBitmap(jpeg);
      } catch (heicErr) {
        // Keep a brief warn so HEIC decode failures stay visible in DevTools.
        // No filename / metadata to avoid unnecessary PII in logs.
        console.warn('[compressImage] heic-to failed, falling back to EXIF thumbnail:', heicErr);
        const thumb = await exifr.thumbnail(file).catch(() => null);
        if (!thumb) throw new Error(t('photo.decodeFailed'));
        const thumbBlob = new Blob([thumb as BlobPart], { type: 'image/jpeg' });
        bitmap = await createImageBitmap(thumbBlob);
      }
    } else {
      const thumb = await exifr.thumbnail(file).catch(() => null);
      if (!thumb) throw new Error(t('photo.decodeFailed'));
      const thumbBlob = new Blob([thumb as BlobPart], { type: 'image/jpeg' });
      bitmap = await createImageBitmap(thumbBlob);
    }
  }
  let { width, height } = bitmap;
  if (width > MAX_SIDE || height > MAX_SIDE) {
    const ratio = Math.min(MAX_SIDE / width, MAX_SIDE / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close(); throw new Error('Canvas context unavailable'); }

  try {
    ctx.drawImage(bitmap, 0, 0, width, height);
  } finally {
    bitmap.close(); // release GPU memory even if drawImage throws
  }

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
  // Release canvas memory (important on iOS where total canvas budget is limited)
  canvas.width = 1;
  canvas.height = 1;
  return dataUrl;
}
