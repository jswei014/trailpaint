import type { ImportBundle, GeoJsonFeatureCollection } from './geojsonImport';

export function parseGeoJson(jsonString: string): ImportBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error('非有效 JSON');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('type' in parsed) ||
    parsed.type !== 'FeatureCollection'
  ) {
    throw new Error('非 GeoJSON FeatureCollection');
  }

  if (!('features' in parsed) || !Array.isArray(parsed.features)) {
    throw new Error('非 GeoJSON FeatureCollection');
  }

  const featureCollection = parsed as GeoJsonFeatureCollection;

  return {
    featureCollection,
  };
}
