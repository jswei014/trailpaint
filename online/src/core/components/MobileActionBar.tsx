import { useProjectStore } from '../store/useProjectStore';
import { t } from '../../i18n';
import './MobileActionBar.css';

interface MobileActionBarProps {
  onImport: () => void;
}

/**
 * 017 D5: mobile (≤600px) bottom bar — list drawer, always-present import
 * (the E13 fast lane), and the draw-route workflow toggle. Replaces the
 * three-mode toolbar + floating actions on phones.
 */
export default function MobileActionBar({ onImport }: MobileActionBarProps) {
  const setSidebarOpen = useProjectStore((s) => s.setSidebarOpen);
  const mode = useProjectStore((s) => s.mode);
  const setMode = useProjectStore((s) => s.setMode);
  const cancelDrawing = useProjectStore((s) => s.cancelDrawing);

  const drawing = mode === 'drawRoute';

  return (
    <div className="mobile-bar">
      <button className="mobile-bar__btn" onClick={() => setSidebarOpen(true)}>
        ☰ {t('bar.list')}
      </button>
      <button className="mobile-bar__btn mobile-bar__btn--primary" onClick={onImport}>
        📥 {t('app.import')}
      </button>
      <button
        className={`mobile-bar__btn${drawing ? ' mobile-bar__btn--active' : ''}`}
        onClick={() => (drawing ? cancelDrawing() : setMode('drawRoute'))}
      >
        ✏️ {t('mode.drawRoute')}
      </button>
    </div>
  );
}
