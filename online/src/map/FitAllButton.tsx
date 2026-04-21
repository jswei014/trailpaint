import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useProjectStore } from '../core/store/useProjectStore';
import { getOverlayZoomCap } from './overlays';
import { t } from '../i18n';

export default function FitAllButton() {
  const map = useMap();
  const spots = useProjectStore((s) => s.project.spots);
  const routes = useProjectStore((s) => s.project.routes);
  const overlayId = useProjectStore((s) => s.project.overlay?.id);

  const handleFit = () => {
    const points: L.LatLngExpression[] = [];

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const halfW = isMobile ? 100 / 2 : 120 / 2;
    const estimatedH = 240;

    spots.forEach((s) => {
      points.push(s.latlng);
      try {
        const point = map.project(s.latlng);
        const corners = [
          L.point(s.cardOffset.x - halfW, s.cardOffset.y),
          L.point(s.cardOffset.x + halfW, s.cardOffset.y),
          L.point(s.cardOffset.x - halfW, s.cardOffset.y + estimatedH),
          L.point(s.cardOffset.x + halfW, s.cardOffset.y + estimatedH),
        ];
        corners.forEach((c) => {
          points.push(map.unproject(point.add(c)));
        });
      } catch {
        // fallback: just use spot latlng
      }
    });

    routes.forEach((r) => {
      r.pts.forEach((pt) => points.push(pt));
    });

    if (points.length === 0) return;

    const bounds = L.latLngBounds(points);
    const cap = getOverlayZoomCap(overlayId);
    const maxZoom = cap !== undefined ? Math.min(16, cap) : 16;
    map.fitBounds(bounds, { padding: [60, 60], maxZoom, duration: 1 });
  };

  if (spots.length === 0 && routes.length === 0) return null;

  return (
    <div className="fit-all-button">
      <button
        className="fit-all-button__btn"
        onClick={handleFit}
        title={t('map.fitAll')}
      >
        🏁
      </button>
    </div>
  );
}
