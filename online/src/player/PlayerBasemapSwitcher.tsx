import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { t } from '../i18n';
import { usePlayerStore } from './usePlayerStore';
import { OVERLAYS, OVERLAY_GROUP_ORDER, OVERLAY_GROUP_LABEL_KEY } from '../map/overlays';
import type { OverlayDef } from '../map/overlays';
import { BASEMAPS, DEFAULT_BASEMAP_ID } from '../map/basemaps';
import type { BasemapDef } from '../map/basemaps';
import { createBasemapLayer } from '../map/basemapLayer';

/** Full basemap + overlay switcher for the Player (mirrors Editor's BasemapSwitcher) */
export default function PlayerBasemapSwitcher() {
  const map = useMap();
  const project = usePlayerStore((s) => s.project);

  // Initialize from project settings (resolve against available basemaps)
  const rawBasemapId = project?.basemapId ?? DEFAULT_BASEMAP_ID;
  const initBasemapId = BASEMAPS.some((b) => b.id === rawBasemapId) ? rawBasemapId : DEFAULT_BASEMAP_ID;
  const initOverlayId = project?.overlay?.id ?? null;
  const initOverlayOpacity = project?.overlay?.opacity ?? 0.5;

  const [current, setCurrent] = useState(initBasemapId);
  const [open, setOpen] = useState(false);
  const [overlayId, setOverlayId] = useState<string | null>(initOverlayId);
  const [overlayOpacity, setOverlayOpacity] = useState(initOverlayOpacity);
  const layerRef = useRef<L.Layer | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent map drag/scroll when interacting with this control
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  }, []);

  const applyBasemap = (bm: BasemapDef) => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const layer = createBasemapLayer(bm);
    layer.addTo(map);
    if ('setZIndex' in layer && typeof layer.setZIndex === 'function') {
      (layer as L.TileLayer).setZIndex(0);
    }
    layerRef.current = layer;
  };

  // Initialize basemap tile layer on mount
  useEffect(() => {
    const bm = BASEMAPS.find((b) => b.id === initBasemapId) ?? BASEMAPS[0];
    applyBasemap(bm);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Create / destroy overlay layer
  useEffect(() => {
    if (!overlayId) {
      overlayRef.current = null;
      return;
    }
    const ov = OVERLAYS.find((o) => o.id === overlayId);
    if (!ov) return;
    const layer = L.tileLayer(ov.url, {
      attribution: ov.attribution,
      maxZoom: ov.maxZoom,
      maxNativeZoom: ov.maxNativeZoom,
      opacity: overlayOpacity,
      crossOrigin: true,
    }).addTo(map);
    layer.setZIndex(1);
    overlayRef.current = layer;
    return () => { map.removeLayer(layer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayId, map]);

  // Update overlay opacity
  useEffect(() => {
    overlayRef.current?.setOpacity(overlayOpacity);
  }, [overlayOpacity]);

  const switchTo = (bm: BasemapDef) => {
    applyBasemap(bm);
    setCurrent(bm.id);
    setOpen(false);
  };

  const handleSelectOverlay = (ov: OverlayDef) => {
    setOverlayId(ov.id);
    if (ov.bounds) {
      const b = L.latLngBounds(ov.bounds);
      if (!b.contains(map.getCenter())) {
        map.fitBounds(b);
      }
    }
  };

  return (
    <div className="basemap-switcher" ref={containerRef}>
      <button
        className={`basemap-switcher__toggle${overlayId ? ' basemap-switcher__toggle--overlay' : ''}`}
        onClick={() => setOpen(!open)}
        title={t('basemap.switch')}
      >
        🗺️
      </button>
      {open && (
        <div
          className="basemap-switcher__menu"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {BASEMAPS.map((bm) => (
            <button
              key={bm.id}
              className={`basemap-switcher__option${current === bm.id ? ' basemap-switcher__option--active' : ''}`}
              onClick={() => switchTo(bm)}
            >
              {t(bm.labelKey)}
            </button>
          ))}

          {/* Historical map overlay section */}
          <div className="basemap-switcher__separator">{t('overlay.title')}</div>
          <button
            className={`basemap-switcher__option${!overlayId ? ' basemap-switcher__option--active' : ''}`}
            onClick={() => setOverlayId(null)}
          >
            {t('overlay.none')}
          </button>
          {OVERLAY_GROUP_ORDER.map((group) => {
            const items = OVERLAYS.filter((o) => o.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <div className="basemap-switcher__separator basemap-switcher__separator--sub">
                  {t(OVERLAY_GROUP_LABEL_KEY[group] as Parameters<typeof t>[0])}
                </div>
                {items.map((ov) => (
                  <button
                    key={ov.id}
                    className={`basemap-switcher__option${overlayId === ov.id ? ' basemap-switcher__option--active' : ''}`}
                    onClick={() => handleSelectOverlay(ov)}
                  >
                    {t(ov.labelKey)}
                  </button>
                ))}
              </div>
            );
          })}
          {overlayId && (
            <div className="basemap-switcher__slider-row">
              <span className="basemap-switcher__slider-label">{t('overlay.opacity')}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(overlayOpacity * 100)}
                onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                className="basemap-switcher__slider"
              />
              <span className="basemap-switcher__slider-value">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
