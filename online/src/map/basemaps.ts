import { currentLocale } from '../i18n';

/* ── Locale → Protomaps lang code ── */

const PROTOMAPS_LANG_MAP: Record<string, string> = {
  'zh-TW': 'zh-Hant',
  'zh': 'zh-Hant',
  'en': 'en',
  'ja': 'ja',
};
export const PROTOMAPS_LANG = PROTOMAPS_LANG_MAP[currentLocale] ?? 'en';
export const PROTOMAPS_KEY = import.meta.env.VITE_PROTOMAPS_KEY as string | undefined;

/* ── Basemap definitions (discriminated union) ── */

export interface RasterBasemap {
  id: string;
  labelKey: 'basemap.osm' | 'basemap.satellite' | 'basemap.topo';
  type: 'raster';
  url: string;
  attribution: string;
  maxZoom?: number;
}

interface VectorBasemap {
  id: string;
  labelKey: 'basemap.multilingual' | 'basemap.dark';
  type: 'vector';
  flavor: string;
}

export type BasemapDef = RasterBasemap | VectorBasemap;

// Vector basemaps need a Protomaps API key (baked at build time).
// Without one, the OSM raster layer becomes the default.
export const DEFAULT_BASEMAP_ID = PROTOMAPS_KEY ? 'multilingual' : 'osm';

export const BASEMAPS: BasemapDef[] = [
  ...(PROTOMAPS_KEY
    ? [{
        id: 'multilingual',
        labelKey: 'basemap.multilingual' as const,
        type: 'vector' as const,
        flavor: 'light',
      }]
    : []),
  {
    id: 'osm',
    labelKey: 'basemap.osm',
    type: 'raster',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: 'topo',
    labelKey: 'basemap.topo',
    type: 'raster',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> &copy; OSM',
    maxZoom: 17,
  },
  {
    id: 'satellite',
    labelKey: 'basemap.satellite',
    type: 'raster',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
  ...(PROTOMAPS_KEY
    ? [{
        id: 'dark',
        labelKey: 'basemap.dark' as const,
        type: 'vector' as const,
        flavor: 'dark',
      }]
    : []),
];
