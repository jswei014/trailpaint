const R = 6371; // Earth radius in km

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance between two [lat, lng] points, returns km */
export function haversine(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Total distance of a polyline in km */
export function polylineDistance(pts: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += haversine(pts[i - 1], pts[i]);
  }
  return total;
}

/** Format distance: < 1km → "XXX m", >= 1km → "X.X km" */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
