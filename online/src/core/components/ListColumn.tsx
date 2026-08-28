import { useProjectStore } from '../store/useProjectStore';
import SpotList from './SpotList';
import SearchBox from './SearchBox';
import { polylineDistance, formatDistance } from '../utils/geo';
import { getRouteColor } from '../models/routes';
import { t } from '../../i18n';

interface ListColumnProps {
  onFlyTo: (latlng: [number, number], zoom?: number) => void;
  /** Mobile drawer renders SearchBox in its own slot above the mode toolbar. */
  showSearch?: boolean;
}

/**
 * 017 D4: search + spot list + route summary, extracted from Sidebar so the
 * desktop grid can mount it as a standalone column while the mobile drawer
 * keeps wrapping the same content. Pure extraction — behavior unchanged.
 */
export default function ListColumn({ onFlyTo, showSearch = true }: ListColumnProps) {
  const spots = useProjectStore((s) => s.project.spots);
  const routes = useProjectStore((s) => s.project.routes);
  const selectedSpotId = useProjectStore((s) => s.selectedSpotId);
  const setSelectedSpot = useProjectStore((s) => s.setSelectedSpot);
  const setSelectedRoute = useProjectStore((s) => s.setSelectedRoute);
  const swapSpots = useProjectStore((s) => s.swapSpots);
  const baseMode = useProjectStore((s) => s.baseMode);
  const mapCenter = useProjectStore((s) => s.project.center);

  const hiddenSpotIds = new Set<string>();
  routes.forEach((r) => {
    if (r.hidden && r.spotIds) {
      r.spotIds.forEach((id) => hiddenSpotIds.add(id));
    }
  });

  const visibleSpots = spots.filter((s) => !hiddenSpotIds.has(s.id));

  const isImageMode = baseMode === 'image';

  const handleSelect = (id: string) => {
    setSelectedSpot(id);
    const spot = spots.find((s) => s.id === id);
    if (spot) onFlyTo(spot.latlng);
  };

  return (
    <>
      {showSearch && !isImageMode && (
        <SearchBox
          mapCenter={mapCenter}
          onSelect={(latlng) => onFlyTo(latlng, 14)}
          onAddSpot={(latlng, title) => useProjectStore.getState().addSpot(latlng, title)}
        />
      )}

      <SpotList
        spots={visibleSpots}
        selectedSpotId={selectedSpotId}
        onSelect={handleSelect}
        onSwap={swapSpots}
      />

      {routes.length > 0 && (
        <div className="route-summary">
          <div className="route-summary__title">{t('route.listTitle')}</div>
          {routes.map((r) => {
            const color = getRouteColor(r.color);
            // Calculate route bounds center for flyTo
            const lats = r.pts.map((p) => p[0]);
            const lngs = r.pts.map((p) => p[1]);
            const center: [number, number] = [
              (Math.min(...lats) + Math.max(...lats)) / 2,
              (Math.min(...lngs) + Math.max(...lngs)) / 2,
            ];
            return (
              <div
                key={r.id}
                className="route-summary__item"
                onClick={() => { setSelectedRoute(r.id); onFlyTo(center, 13); }}
              >
                <span className="route-summary__color" style={{ background: color.stroke }} />
                <div className="route-summary__info">
                  {r.name && <span className="route-summary__name">{r.name}</span>}
                  {!isImageMode && r.pts.length > 1 && (
                    <span className="route-summary__dist">{formatDistance(polylineDistance(r.pts))}</span>
                  )}
                </div>
                <button
                  className="route-summary__visibility-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    useProjectStore.getState().toggleRouteVisibility(r.id);
                  }}
                  title={r.hidden ? t('route.show') : t('route.hide')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                >
                  {r.hidden ? '🙈' : '👁️'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
