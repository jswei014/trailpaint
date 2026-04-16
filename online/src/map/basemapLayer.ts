import L from 'leaflet';
import { leafletLayer } from 'protomaps-leaflet';
import { BASEMAPS, PROTOMAPS_KEY, PROTOMAPS_LANG, DEFAULT_BASEMAP_ID } from './basemaps';
import type { BasemapDef, RasterBasemap } from './basemaps';

/** Create a Leaflet tile layer from a BasemapDef. */
export function createBasemapLayer(bm: BasemapDef): L.Layer {
  if (bm.type === 'vector' && PROTOMAPS_KEY) {
    return leafletLayer({
      url: `https://api.protomaps.com/tiles/v4/{z}/{x}/{y}.mvt?key=${encodeURIComponent(PROTOMAPS_KEY)}`,
      flavor: bm.flavor,
      lang: PROTOMAPS_LANG,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a> Protomaps',
    }) as unknown as L.Layer;
  }
  const raster = (bm.type === 'raster' ? bm : BASEMAPS[0]) as RasterBasemap;
  return L.tileLayer(raster.url, {
    attribution: raster.attribution,
    maxZoom: raster.maxZoom ?? 19,
    crossOrigin: true,
  });
}

/** Resolve a basemapId to a known ID, falling back to default. */
export function resolveBasemapId(id: string | undefined): string {
  return id && BASEMAPS.some((b) => b.id === id) ? id : DEFAULT_BASEMAP_ID;
}
