import { useRef, useEffect, useCallback } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { createPortal } from 'react-dom';
import SpotCard from '../core/components/SpotCard';
import '../core/components/SpotCard.css';
import type { Spot } from '../core/models/types';
import { getIcon } from '../core/icons';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
import { useProjectStore } from '../core/store/useProjectStore';

export default function SpotMarker({ spot }: { spot: Spot }) {
  const map = useMap();
  const selectedSpotId = useProjectStore((s) => s.selectedSpotId);
  const setSelectedSpot = useProjectStore((s) => s.setSelectedSpot);
  const updateSpot = useProjectStore((s) => s.updateSpot);
  const markerRef = useRef<L.Marker | null>(null);

  const selected = selectedSpotId === spot.id;
  const icon = getIcon(spot.iconId);

  const pinIcon = L.divIcon({
    className: 'spot-pin',
    html: `<div class="spot-pin__circle"><span>${escapeHtml(icon.emoji)}</span></div>`,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });

  const onMarkerDragEnd = useCallback(() => {
    const m = markerRef.current;
    if (!m) return;
    const pos = m.getLatLng();
    updateSpot(spot.id, { latlng: [pos.lat, pos.lng] });
  }, [spot.id, updateSpot]);

  return (
    <>
      <Marker
        position={spot.latlng}
        icon={pinIcon}
        draggable
        ref={markerRef}
        eventHandlers={{
          dragend: onMarkerDragEnd,
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            setSelectedSpot(spot.id);
          },
        }}
      />
      <CardOverlay
        spot={spot}
        selected={selected}
        map={map}
        onSelect={() => setSelectedSpot(spot.id)}
        onUpdateOffset={(offset) => updateSpot(spot.id, { cardOffset: offset })}
      />
    </>
  );
}

/* ── Card overlay: rendered as a portal in the map container ── */

interface CardOverlayProps {
  spot: Spot;
  selected: boolean;
  map: L.Map;
  onSelect: () => void;
  onUpdateOffset: (offset: { x: number; y: number }) => void;
}

function CardOverlay({ spot, selected, map, onSelect, onUpdateOffset }: CardOverlayProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const dragRef = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  // Reposition card + line on every map move
  const reposition = useCallback(() => {
    const wrap = wrapRef.current;
    const line = lineRef.current;
    if (!wrap) return;

    const pt = map.latLngToContainerPoint(spot.latlng);
    // Card position = pin screen point + cardOffset, shift left by half card width
    wrap.style.transform = `translate(${pt.x + spot.cardOffset.x - 90}px, ${pt.y + spot.cardOffset.y}px)`;

    // Connector line endpoints (relative to wrap's SVG)
    if (line) {
      // Pin point relative to card top-left (card is centered at offset, width=180 → shift back 90)
      const dx = -spot.cardOffset.x + 90; // pin is at (90 - offset.x) relative to card left
      const dy = -spot.cardOffset.y;       // pin is at (-offset.y) relative to card top
      line.setAttribute('x1', String(90)); // card center-x
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(dx));
      line.setAttribute('y2', String(dy));
    }
  }, [map, spot.latlng, spot.cardOffset]);

  useEffect(() => {
    reposition();
    map.on('move zoom viewreset', reposition);
    return () => { map.off('move zoom viewreset', reposition); };
  }, [map, reposition]);

  // Card dragging
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    map.dragging.disable();
    dragRef.current = {
      mx: e.clientX, my: e.clientY,
      ox: spot.cardOffset.x, oy: spot.cardOffset.y,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      onUpdateOffset({
        x: dragRef.current.ox + (ev.clientX - dragRef.current.mx),
        y: dragRef.current.oy + (ev.clientY - dragRef.current.my),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      map.dragging.enable();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('blur', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('blur', onUp);
  }, [map, spot.cardOffset, onUpdateOffset]);

  return createPortal(
    <div
      ref={wrapRef}
      className="spot-overlay"
      onMouseDown={onMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Connector */}
      <svg className="spot-connector">
        <line
          ref={lineRef}
          stroke="rgba(100,50,10,0.55)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      </svg>
      <SpotCard spot={spot} selected={selected} onSelect={onSelect} />
    </div>,
    map.getContainer(),
  );
}
