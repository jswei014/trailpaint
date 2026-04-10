import { useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { t } from '../i18n';

interface BasemapDef {
  id: string;
  labelKey: 'basemap.voyager' | 'basemap.satellite' | 'basemap.topo' | 'basemap.dark';
  url: string;
  attribution: string;
  maxZoom?: number;
}

const BASEMAPS: BasemapDef[] = [
  {
    id: 'voyager',
    labelKey: 'basemap.voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  {
    id: 'satellite',
    labelKey: 'basemap.satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
  {
    id: 'topo',
    labelKey: 'basemap.topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> &copy; OSM',
    maxZoom: 17,
  },
  {
    id: 'dark',
    labelKey: 'basemap.dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OSM &copy; CARTO',
  },
];

export default function BasemapSwitcher() {
  const map = useMap();
  const [current, setCurrent] = useState('voyager');
  const [open, setOpen] = useState(false);
  const [tileLayer, setTileLayer] = useState<L.TileLayer | null>(null);

  const switchTo = (bm: BasemapDef) => {
    if (tileLayer) {
      map.removeLayer(tileLayer);
    }
    const layer = L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: bm.maxZoom ?? 19,
    }).addTo(map);
    // Move to bottom
    layer.setZIndex(0);
    setTileLayer(layer);
    setCurrent(bm.id);
    setOpen(false);
  };

  return (
    <div className="basemap-switcher">
      <button
        className="basemap-switcher__toggle"
        onClick={() => setOpen(!open)}
        title={t('basemap.switch')}
      >
        🗺️
      </button>
      {open && (
        <div className="basemap-switcher__menu">
          {BASEMAPS.map((bm) => (
            <button
              key={bm.id}
              className={`basemap-switcher__option${current === bm.id ? ' basemap-switcher__option--active' : ''}`}
              onClick={() => switchTo(bm)}
            >
              {t(bm.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
