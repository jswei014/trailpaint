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
  labelKey: 'basemap.voyager' | 'basemap.satellite' | 'basemap.topo' | 'basemap.dark';
  type: 'raster';
  url: string;
  attribution: string;
  maxZoom?: number;
}

interface VectorBasemap {
  id: string;
  labelKey: 'basemap.multilingual';
  type: 'vector';
  flavor: string;
}

export type BasemapDef = RasterBasemap | VectorBasemap;

export const DEFAULT_BASEMAP_ID = 'voyager';

export const BASEMAPS: BasemapDef[] = [
  {
    id: 'voyager',
    labelKey: 'basemap.voyager',
    type: 'raster',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  {
    id: 'satellite',
    labelKey: 'basemap.satellite',
    type: 'raster',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
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
    id: 'dark',
    labelKey: 'basemap.dark',
    type: 'raster',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OSM &copy; CARTO',
  },
  ...(PROTOMAPS_KEY
    ? [{
        id: 'multilingual',
        labelKey: 'basemap.multilingual' as const,
        type: 'vector' as const,
        flavor: 'light',
      }]
    : []),
];
