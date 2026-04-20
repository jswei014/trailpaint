/**
 * Reverse geocode a [lat, lng] to a short place name.
 *
 * Strategy: try Photon (Komoot — no public rate limit, hiking-trail friendly)
 * first. If Photon returns nothing, fall back to Nominatim (OSM's default
 * service — stricter 1 req/s limit, prone to 429 IP bans on small bursts).
 * Both wrap the same OSM data, so a fail-over between them keeps output shape
 * and language consistent; it's the rate-limit profile that differs.
 *
 * Result is "{specific}, {city}" when both exist and differ, otherwise a
 * single value. Empty string on any error — caller (geocodeQueue) treats
 * empty as "no result" and skips its checkAndSet callback.
 */
export async function reverseGeocode(latlng: [number, number]): Promise<string> {
  const photon = await reverseGeocodePhoton(latlng);
  if (photon) return photon;
  return reverseGeocodeNominatim(latlng);
}

/* ─── Photon (primary) ─── */

async function reverseGeocodePhoton(latlng: [number, number]): Promise<string> {
  try {
    const [lat, lng] = latlng;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    // Photon's `lang=` only accepts de/en/fr/default; for other locales it
    // already serves multilingual `name` based on OSM name:xx tags, so we
    // skip lang and let Photon pick the local-language name (what shows
    // up for Taiwan / Japan / Thailand coords).
    const url = `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'zh-TW,zh,en',
        'User-Agent': 'TrailPaint/1.0 (https://github.com/notoriouslab/trailpaint)',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn('[reverseGeocode] Photon non-ok:', res.status);
      return '';
    }
    const data = await res.json();
    return formatPhotonPlaceName(data);
  } catch {
    return '';
  }
}

// Exported for unit tests
export function formatPhotonPlaceName(data: {
  features?: Array<{
    properties?: {
      name?: string;
      city?: string;
      town?: string;
      village?: string;
      county?: string;
      state?: string;
      district?: string;
      locality?: string;
      suburb?: string;
      osm_key?: string;
      osm_value?: string;
    };
  }>;
}): string {
  const feat = data?.features?.[0];
  if (!feat?.properties) return '';
  const p = feat.properties;

  const specific = p.name || '';
  const district = p.district || p.locality || p.suburb || '';
  const cityCounty = p.city || p.town || p.village || p.county || p.state || '';

  if (specific) {
    return cityCounty && cityCounty !== specific ? `${specific}, ${cityCounty}` : specific;
  }
  if (district) {
    return cityCounty && cityCounty !== district ? `${district}, ${cityCounty}` : district;
  }
  if (cityCounty) return cityCounty;
  return '';
}

/* ─── Nominatim (fallback) ─── */

async function reverseGeocodeNominatim(latlng: [number, number]): Promise<string> {
  try {
    const [lat, lng] = latlng;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}` +
      `&zoom=17&addressdetails=1&namedetails=1&extratags=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'zh-TW,zh,en',
        'User-Agent': 'TrailPaint/1.0 (https://github.com/notoriouslab/trailpaint)',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      if (res.status === 429) {
        console.warn('[reverseGeocode] Nominatim 429 — IP rate-limited');
      }
      return '';
    }
    const data = await res.json();
    return formatPlaceName(data);
  } catch {
    return '';
  }
}

// Exported for unit tests (Nominatim formatter)
export function formatPlaceName(data: {
  display_name?: string;
  name?: string;
  namedetails?: Record<string, string>;
  address?: Record<string, string>;
}): string {
  const nd = data.namedetails ?? {};
  const addr = data.address ?? {};

  // Tier 1: specific place — namedetails (prefer zh) or POI tag
  const specific =
    nd['name:zh-TW'] ||
    nd['name:zh'] ||
    nd.name ||
    data.name ||
    addr.tourism ||
    addr.attraction ||
    addr.historic ||
    addr.amenity ||
    addr.shop ||
    addr.leisure ||
    addr.building ||
    '';

  // Tier 2: neighbourhood / sub-area
  const district =
    addr.neighbourhood ||
    addr.suburb ||
    addr.quarter ||
    addr.hamlet ||
    addr.city_district ||
    '';

  // Tier 3: city / county / state
  const cityCounty =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.county ||
    addr.state ||
    '';

  if (specific) {
    return cityCounty && cityCounty !== specific ? `${specific}, ${cityCounty}` : specific;
  }
  if (district) {
    return cityCounty && cityCounty !== district ? `${district}, ${cityCounty}` : district;
  }
  if (cityCounty) return cityCounty;

  return data.display_name?.split(',')[0]?.trim() ?? '';
}
