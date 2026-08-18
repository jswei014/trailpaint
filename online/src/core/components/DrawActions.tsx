import { useProjectStore } from '../store/useProjectStore';
import { t } from '../../i18n';

/**
 * Draw-route workflow actions (hint + finish / connect-spots / cancel).
 * Shared between the mobile mode toolbar and the desktop draw banner so the
 * d8e2e43 exit-cleanup semantics live in exactly one place.
 */
export default function DrawActions() {
  const currentDrawing = useProjectStore((s) => s.currentDrawing);
  const finishRoute = useProjectStore((s) => s.finishRoute);
  const cancelDrawing = useProjectStore((s) => s.cancelDrawing);
  const connectSpotsAsRoute = useProjectStore((s) => s.connectSpotsAsRoute);
  const spots = useProjectStore((s) => s.project.spots);

  return (
    <div className="mode-toolbar__draw-actions">
      <span className="mode-toolbar__hint">
        {currentDrawing.length === 0
          ? t('route.hintStart')
          : `${currentDrawing.length} ${t('route.hintPoints')}`}
      </span>
      <button
        className="mode-toolbar__action-btn mode-toolbar__action-btn--finish"
        onClick={finishRoute}
        disabled={currentDrawing.length < 2}
      >
        {t('route.finish')}
      </button>
      <button
        className="mode-toolbar__action-btn"
        onClick={connectSpotsAsRoute}
        disabled={spots.length < 2}
      >
        {t('route.connectSpots')}
      </button>
      <button
        className="mode-toolbar__action-btn"
        onClick={cancelDrawing}
      >
        {t('route.cancel')}
      </button>
    </div>
  );
}
