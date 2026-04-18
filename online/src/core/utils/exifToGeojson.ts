import type { ImportBundle } from './geojsonImport';
import { parseExif } from './exifParser';

export const MAX_PHOTO_BATCH = 20;
// Per-photo size cap before EXIF parsing — reject 50MB payloads that would OOM the tab.
// Camera JPEGs are typically 2–5MB; 10MB is generous without inviting abuse.
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export interface ExifStats {
  total: number;
  withGps: number;
  withoutGps: number;
  unreadable: number;
}

type PointFeature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    title: string;
    desc: string;
    photoRef: string;
    pendingLocation?: boolean;
  };
};

/**
 * Convert a batch of photos to a GeoJSON FeatureCollection via EXIF parsing.
 * - Processes up to MAX_PHOTO_BATCH photos (caller truncates or surfaces toast)
 * - Files larger than MAX_PHOTO_BYTES are counted unreadable (skip EXIF to avoid OOM)
 * - Photos with GPS become Points at their real location
 * - Photos without GPS become Points at mapCenter + pendingLocation=true
 * - Unreadable files (parseExif throws) are counted in stats.unreadable and produce no feature
 */
export async function exifToGeojson(
  files: File[],
  mapCenter: [number, number], // [lat, lng]
): Promise<ImportBundle & { stats: ExifStats }> {
  const stats: ExifStats = {
    total: files.length,
    withGps: 0,
    withoutGps: 0,
    unreadable: 0,
  };

  const filesToProcess = files.slice(0, MAX_PHOTO_BATCH);
  const features: PointFeature[] = [];
  const photoFiles = new Map<string, File>();
  const mapCenterLnglat: [number, number] = [mapCenter[1], mapCenter[0]];

  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i];
    // Yield to the event loop so the UI stays responsive for 20 photos (D2)
    await new Promise((r) => setTimeout(r, 0));

    // Reject oversized files up-front; exifr on 50MB+ payloads OOMs the tab.
    if (file.size > MAX_PHOTO_BYTES) {
      stats.unreadable++;
      continue;
    }

    let exifData;
    try {
      exifData = await parseExif(file);
    } catch {
      // exifr lite only fully decodes JPEG/TIFF; HEIC/PNG/WebP screenshots
      // may throw. Treat any image/* file as "no EXIF" → pendingLocation so
      // the user can drag it onto the map, rather than silently dropping it.
      const isImage =
        file.type.startsWith('image/') ||
        /\.(heic|heif|png|webp|gif|tiff?|jpe?g|bmp|avif)$/i.test(file.name);
      if (!isImage) {
        stats.unreadable++;
        continue;
      }
      exifData = { file, latlng: null, takenAt: null };
    }

    const photoRef = `${file.name}::${i}`;
    photoFiles.set(photoRef, file);

    // Title uses short MM-DD prefix so a multi-day album reads as
    // "01-21 曼谷" / "01-22 清邁" without clutter. Desc keeps the full
    // timestamp for reference.
    const shortDate = exifData.takenAt ? formatShortDate(exifData.takenAt) : null;
    const fullDateTime = exifData.takenAt ? formatDateTime(exifData.takenAt) : null;
    const title = shortDate ?? file.name.replace(/\.[^.]+$/, '');
    const desc = fullDateTime ?? '';

    let coordinates: [number, number]; // GeoJSON [lng, lat]
    let pendingLocation = false;
    if (exifData.latlng) {
      coordinates = [exifData.latlng[1], exifData.latlng[0]];
      stats.withGps++;
    } else {
      coordinates = mapCenterLnglat;
      pendingLocation = true;
      stats.withoutGps++;
    }

    const feature: PointFeature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates },
      properties: {
        title,
        desc,
        photoRef,
        ...(pendingLocation && { pendingLocation: true }),
      },
    };
    features.push(feature);
  }

  return {
    featureCollection: { type: 'FeatureCollection', features },
    photoFiles: photoFiles.size > 0 ? photoFiles : undefined,
    stats,
  };
}

function formatShortDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function formatDateTime(date: Date): string {
  // Use local methods so EXIF DateTimeOriginal displays as the original
  // camera wall-clock time. exifr interprets the EXIF string with the
  // viewer's local TZ; read-back via local methods yields the original
  // wall-clock unchanged — accurate for the common "captured locally,
  // viewed locally" case without extra OffsetTimeOriginal parsing.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
