/**
 * Reverse geocode a [lat, lng] to a short place name via Nominatim.
 *
 * Resolution strategy (fall through; never worse than the administrative name):
 *   1. Specific place name — namedetails (prefers zh), or POI tag
 *      (tourism / attraction / historic / amenity / shop / leisure / building)
 *   2. Neighbourhood / suburb / village / district
 *   3. City / county / state
 *   4. display_name's first segment (last-resort Nominatim fallback)
 *
 * Result is "{specific}, {city}" when both exist and differ, otherwise a
 * single value. Empty string on any error — caller (geocodeQueue) treats
 * empty as "no result" and skips its checkAndSet callback.
 */
export async function reverseGeocode(latlng: [number, number]): Promise<string> {
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
    if (!res.ok) return '';
    const data = await res.json();
    return formatPlaceName(data);
  } catch {
    return '';
  }
}

// Exported for unit tests
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
