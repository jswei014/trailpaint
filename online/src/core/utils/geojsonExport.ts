import type { Project } from '../models/types';
import type { GeoJsonFeatureCollection, GeoJsonFeature } from './geojsonImport';

/**
 * Convert a Project to GeoJSON FeatureCollection string.
 * Spots → Point features; Routes → LineString features.
 * Does NOT include photo (D7 boundary: open data export only).
 *
 * @param project The project to export
 * @returns Stringified GeoJSON FeatureCollection with pretty printing
 */
export function projectToGeojson(project: Project): string {
  const features: GeoJsonFeature[] = [];

  // Convert spots to Point features
  project.spots.forEach((spot) => {
    const feature: GeoJsonFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        // Convert [lat, lng] to [lng, lat] for GeoJSON
        coordinates: [spot.latlng[1], spot.latlng[0]],
      },
      properties: {
        id: spot.id,
        num: spot.num,
        ...(spot.title && { title: spot.title }),
        ...(spot.desc && { desc: spot.desc }),
        iconId: spot.iconId,
      },
    };
    features.push(feature);
  });

  // Convert routes to LineString features
  project.routes.forEach((route) => {
    const feature: GeoJsonFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        // Convert each [lat, lng] point to [lng, lat] for GeoJSON
        coordinates: route.pts.map(([lat, lng]) => [lng, lat]),
      },
      properties: {
        id: route.id,
        ...(route.name && { name: route.name }),
        color: route.color,
      },
    };
    features.push(feature);
  });

  const featureCollection: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features,
  };

  return JSON.stringify(featureCollection, null, 2);
}
