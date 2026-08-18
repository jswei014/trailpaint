import { useEffect, useReducer, useMemo } from 'react';
import { Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useProjectStore } from '../core/store/useProjectStore';
import { useIsMobile } from '../core/hooks/useIsMobile';
import { chipReduce } from '../core/utils/chipReducer';
import { t } from '../i18n';

/**
 * 017 D5: mobile tap-to-add chip. In select mode with nothing selected, a
 * map tap drops a "add spot here" chip at the tap point; tapping the chip
 * confirms via the existing addSpot action. All transition rules live in
 * chipReduce (unit-tested); this component wires Leaflet events to it.
 */
export default function AddChip() {
  const isMobile = useIsMobile();
  const mode = useProjectStore((s) => s.mode);
  const selectedSpotId = useProjectStore((s) => s.selectedSpotId);
  const selectedRouteId = useProjectStore((s) => s.selectedRouteId);
  const addSpot = useProjectStore((s) => s.addSpot);
  const [chip, dispatch] = useReducer(chipReduce, null);

  // A selection appearing (marker tap, list tap) retires the chip.
  useEffect(() => {
    if (selectedSpotId || selectedRouteId) dispatch({ type: 'selection' });
  }, [selectedSpotId, selectedRouteId]);

  // Tapping any UI outside the map canvas (bottom bar, drawer, cards)
  // dismisses the chip. Capture phase so stopPropagation elsewhere can't
  // leave a stale chip behind.
  useEffect(() => {
    if (!chip) return;
    const onDown = (e: Event) => {
      const container = document.querySelector('.leaflet-container');
      if (container && !container.contains(e.target as Node)) {
        dispatch({ type: 'outside' });
      }
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [chip]);

  useMapEvents({
    click(e) {
      if (!isMobile || mode !== 'select') return;
      const s = useProjectStore.getState();
      if (s.selectedSpotId || s.selectedRouteId) return; // that tap deselects
      dispatch({
        type: 'mapTap',
        latlng: [e.latlng.lat, e.latlng.lng],
        ts: e.originalEvent?.timeStamp ?? performance.now(),
      });
    },
  });

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'add-chip',
        html: `<span class="add-chip__pill">📍 ${t('chip.addHere')}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
    [],
  );

  if (!isMobile || !chip) return null;

  return (
    <Marker
      position={chip.latlng}
      icon={icon}
      zIndexOffset={2000}
      eventHandlers={{
        click: () => {
          addSpot(chip.latlng);
          dispatch({ type: 'confirm' });
        },
      }}
    />
  );
}
