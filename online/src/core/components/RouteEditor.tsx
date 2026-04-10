import type { Route } from '../models/routes';
import { ROUTE_COLORS } from '../models/routes';
import { useProjectStore } from '../store/useProjectStore';
import { polylineDistance, formatDistance } from '../utils/geo';
import { t } from '../../i18n';

interface RouteEditorProps {
  route: Route;
  onClose: () => void;
}

export default function RouteEditor({ route, onClose }: RouteEditorProps) {
  const setRouteColor = useProjectStore((s) => s.setRouteColor);
  const deleteRoute = useProjectStore((s) => s.deleteRoute);

  return (
    <div className="route-editor">
      <div className="route-editor__header">
        <span className="route-editor__title">{t('route.editTitle')}</span>
        <button className="spot-editor__close" onClick={onClose}>✕</button>
      </div>

      <div className="route-editor__info">
        {formatDistance(polylineDistance(route.pts))} · {route.pts.length} {t('route.points')}
      </div>

      <div className="spot-editor__label">{t('route.color')}</div>
      <div className="route-editor__colors">
        {ROUTE_COLORS.map((c) => (
          <button
            key={c.id}
            className={`route-editor__color-btn${route.color === c.id ? ' route-editor__color-btn--active' : ''}`}
            style={{ background: c.stroke }}
            title={c.label}
            onClick={() => setRouteColor(route.id, c.id)}
          />
        ))}
      </div>

      <div className="route-editor__hint">{t('route.editHint')}</div>

      <button
        className="spot-editor__btn spot-editor__btn--danger"
        onClick={() => {
          if (confirm(t('route.deleteConfirm'))) deleteRoute(route.id);
        }}
      >
        {t('route.delete')}
      </button>
    </div>
  );
}
