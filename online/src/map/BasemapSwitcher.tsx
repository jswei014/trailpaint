import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { t } from '../i18n';
import { useProjectStore } from '../core/store/useProjectStore';
import { OVERLAYS } from './overlays';
import { BASEMAPS } from './basemaps';
import type { BasemapDef } from './basemaps';
import { createBasemapLayer, resolveBasemapId } from './basemapLayer';

export default function BasemapSwitcher() {
  const map = useMap();
  const projectBasemapId = useProjectStore((s) => s.project.basemapId);
  const setBasemapId = useProjectStore((s) => s.setBasemapId);
  const resolvedId = resolveBasemapId(projectBasemapId);
  const [current, setCurrent] = useState(resolvedId);
  const [open, setOpen] = useState(false);
  const layerRef = useRef<L.Layer | null>(null);
  const appliedRef = useRef(resolvedId); // tracks what Leaflet actually shows
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent map drag/scroll when interacting with this control
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  }, []);

  // Overlay state (persisted in project store)
  const overlay = useProjectStore((s) => s.project.overlay);
  const setOverlay = useProjectStore((s) => s.setOverlay);
  const overlayId = overlay?.id ?? null;
  const overlayOpacity = overlay?.opacity ?? 0.5;
  const overlayRef = useRef<L.TileLayer | null>(null);

  // Apply a basemap to the Leaflet map (imperative, no store write)
  const applyBasemap = (bm: BasemapDef) => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const layer = createBasemapLayer(bm);
    layer.addTo(map);
    if ('setZIndex' in layer && typeof layer.setZIndex === 'function') {
      (layer as L.TileLayer).setZIndex(0);
    }
    layerRef.current = layer;
    appliedRef.current = bm.id;
  };

  // Initialize tile layer on mount
  useEffect(() => {
    const bm = BASEMAPS.find((b) => b.id === resolvedId) ?? BASEMAPS[0];
    applyBasemap(bm);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Sync Leaflet layer when store basemapId changes externally (undo/redo/import)
  useEffect(() => {
    const targetId = resolveBasemapId(projectBasemapId);
    if (targetId === appliedRef.current) return;
    const bm = BASEMAPS.find((b) => b.id === targetId) ?? BASEMAPS[0];
    applyBasemap(bm);
    setCurrent(bm.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectBasemapId]);

  // Create / destroy overlay layer when selection changes
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
      opacity: overlayOpacity,
      crossOrigin: true,
    }).addTo(map);
    layer.setZIndex(1);
    overlayRef.current = layer;
    return () => { map.removeLayer(layer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayId, map]);

  // Update overlay opacity without recreating layer
  useEffect(() => {
    overlayRef.current?.setOpacity(overlayOpacity);
  }, [overlayOpacity]);

  const switchTo = (bm: BasemapDef) => {
    applyBasemap(bm);
    setCurrent(bm.id);
    setBasemapId(bm.id);
    setOpen(false);
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
            onClick={() => setOverlay(null)}
          >
            {t('overlay.none')}
          </button>
          {OVERLAYS.map((ov) => (
            <button
              key={ov.id}
              className={`basemap-switcher__option${overlayId === ov.id ? ' basemap-switcher__option--active' : ''}`}
              onClick={() => setOverlay({ id: ov.id, opacity: overlayOpacity })}
            >
              {t(ov.labelKey)}
            </button>
          ))}
          {overlayId && (
            <div className="basemap-switcher__slider-row">
              <span className="basemap-switcher__slider-label">{t('overlay.opacity')}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(overlayOpacity * 100)}
                onChange={(e) => setOverlay({ id: overlayId!, opacity: Number(e.target.value) / 100 })}
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
