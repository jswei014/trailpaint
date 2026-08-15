/**
 * Forward geocoding service with dual-engine fallback (Photon + Nominatim),
 * location proximity bias, and Traditional Chinese '台' ⇄ '臺' variant fallback.
 */

export interface SearchResultItem {
  display_name: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: string;
  class: string;
}

export interface ForwardGeocodeOptions {
  proximity?: [number, number]; // [lat, lng] to bias search results
  limit?: number;
  signal?: AbortSignal;
}

const COORD_RE = /^\s*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)\s*$/;

export function parseCoords(input: string): [number, number] | null {
  const m = input.match(COORD_RE);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (!isFinite(lat) || !isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

/**
 * Returns alternate query string by switching '台' ⇄ '臺', or null if neither character is present.
 */
export function getAlternateQuery(query: string): string | null {
  const hasTai1 = query.includes('台');
  const hasTai2 = query.includes('臺');
  if (!hasTai1 && !hasTai2) return null;
  if (hasTai1 && !hasTai2) {
    return query.replace(/台/g, '臺');
  }
  if (hasTai2 && !hasTai1) {
    return query.replace(/臺/g, '台');
  }
  // If both exist, swap them
  return query.replace(/[台臺]/g, (m) => (m === '台' ? '臺' : '台'));
}

export function splitDisplayName(displayName: string): { name: string; address: string } {
  const parts = displayName.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return { name: displayName.trim(), address: '' };
  return {
    name: parts[0],
    address: parts.slice(1, 3).join(', '),
  };
}

/* ─── Photon (Primary) ─── */

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number]; // [lon, lat]
  };
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
    country?: string;
    street?: string;
    housenumber?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

export function formatPhotonFeature(feature: PhotonFeature): SearchResultItem | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lon, lat] = coords;
  if (!isFinite(lat) || !isFinite(lon)) return null;

  const p = feature.properties || {};
  const specific = p.name || (p.street ? `${p.street}${p.housenumber ? ' ' + p.housenumber : ''}` : '');
  const district = p.district || p.locality || p.suburb || '';
  const cityCounty = p.city || p.town || p.village || p.county || p.state || '';
  const country = p.country || '';

  const name = specific || district || cityCounty || 'Location';
  const addressParts = [
    district !== name ? district : '',
    cityCounty !== name ? cityCounty : '',
    country !== name ? country : '',
  ].filter(Boolean);

  const address = addressParts.join(', ');
  const display_name = address ? `${name}, ${address}` : name;
  const type = p.osm_value || p.type || 'place';
  const cls = p.osm_key || 'place';

  return {
    display_name,
    name,
    address,
    lat,
    lon,
    type,
    class: cls,
  };
}

export async function searchPhoton(
  query: string,
  options?: ForwardGeocodeOptions
): Promise<SearchResultItem[]> {
  try {
    const limit = options?.limit ?? 5;
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (options?.proximity) {
      const [lat, lon] = options.proximity;
      if (isFinite(lat) && isFinite(lon)) {
        url += `&lat=${lat}&lon=${lon}`;
      }
    }

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'zh-TW,zh,en',
        'User-Agent': 'TrailPaint/1.0 (https://github.com/notoriouslab/trailpaint)',
      },
      signal: options?.signal,
    });

    if (!res.ok) return [];
    const data = (await res.json()) as PhotonResponse;
    const features = data?.features || [];
    return features
      .map(formatPhotonFeature)
      .filter((item): item is SearchResultItem => item !== null);
  } catch {
    return [];
  }
}

/* ─── Nominatim (Fallback) ─── */

interface NominatimRawItem {
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
}

export function formatNominatimItem(item: NominatimRawItem): SearchResultItem | null {
  const lat = parseFloat(item.lat || '');
  const lon = parseFloat(item.lon || '');
  if (!isFinite(lat) || !isFinite(lon)) return null;

  const rawDisplay = item.display_name || item.name || '';
  const { name: parsedName, address } = splitDisplayName(rawDisplay);
  const name = item.name || parsedName || rawDisplay;

  return {
    display_name: rawDisplay,
    name,
    address,
    lat,
    lon,
    type: item.type || 'place',
    class: item.class || 'place',
  };
}

export async function searchNominatim(
  query: string,
  options?: ForwardGeocodeOptions
): Promise<SearchResultItem[]> {
  try {
    const limit = options?.limit ?? 5;
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=0`;
    if (options?.proximity) {
      const [lat, lon] = options.proximity;
      if (isFinite(lat) && isFinite(lon)) {
        // Provide a loose viewbox (+/- 2 degrees) to bias nearby results
        const left = (lon - 2).toFixed(4);
        const right = (lon + 2).toFixed(4);
        const top = (lat + 2).toFixed(4);
        const bottom = (lat - 2).toFixed(4);
        url += `&viewbox=${left},${top},${right},${bottom}`;
      }
    }

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'zh-TW,zh,en',
        'User-Agent': 'TrailPaint/1.0 (https://github.com/notoriouslab/trailpaint)',
      },
      signal: options?.signal,
    });

    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => formatNominatimItem(item as NominatimRawItem))
      .filter((item): item is SearchResultItem => item !== null);
  } catch {
    return [];
  }
}

/* ─── Main Unified forwardGeocode ─── */

export async function forwardGeocode(
  rawQuery: string,
  options?: ForwardGeocodeOptions
): Promise<SearchResultItem[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];

  // 1. Direct coordinate match (e.g. "25.0330, 121.5654")
  const coords = parseCoords(q);
  if (coords) {
    const [lat, lon] = coords;
    return [
      {
        display_name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        address: '',
        lat,
        lon,
        type: 'coordinate',
        class: 'coordinate',
      },
    ];
  }

  // 2. Try Primary: Photon
  let results = await searchPhoton(q, options);

  // 3. Alternate '台' ⇄ '臺' on Photon if empty
  const altQuery = getAlternateQuery(q);
  if (results.length === 0 && altQuery) {
    results = await searchPhoton(altQuery, options);
  }

  // 4. If still empty or Photon failed, fallback to Nominatim
  if (results.length === 0) {
    results = await searchNominatim(q, options);
  }

  // 5. Alternate '台' ⇄ '臺' on Nominatim if still empty
  if (results.length === 0 && altQuery) {
    results = await searchNominatim(altQuery, options);
  }

  return results;
}
