import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { usePlayerStore } from './usePlayerStore';
import { t } from '../i18n';

export default function PlayerFitAll() {
  const map = useMap();
  const project = usePlayerStore((s) => s.project);

  if (!project || (project.spots.length === 0 && project.routes.length === 0)) return null;

  const handleFit = () => {
    const points: L.LatLngExpression[] = [];
    project.spots.forEach((s) => points.push(s.latlng));
    project.routes.forEach((r) => r.pts.forEach((pt) => points.push(pt)));
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, duration: 1 });
  };

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
