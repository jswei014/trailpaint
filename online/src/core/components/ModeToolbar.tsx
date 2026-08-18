import type { Mode } from '../models/types';
import { useProjectStore } from '../store/useProjectStore';
import DrawActions from './DrawActions';
import { t } from '../../i18n';

const MODES: { mode: Mode; icon: string; labelKey: 'mode.select' | 'mode.addSpot' | 'mode.drawRoute' }[] = [
  { mode: 'select', icon: '🖱️', labelKey: 'mode.select' },
  { mode: 'addSpot', icon: '📍', labelKey: 'mode.addSpot' },
  { mode: 'drawRoute', icon: '🖊️', labelKey: 'mode.drawRoute' },
];

export default function ModeToolbar() {
  const mode = useProjectStore((s) => s.mode);
  const setMode = useProjectStore((s) => s.setMode);

  return (
    <div className="mode-toolbar">
      <div className="mode-toolbar__modes">
        {MODES.map((m) => (
          <button
            key={m.mode}
            className={`mode-toolbar__btn${mode === m.mode ? ' mode-toolbar__btn--active' : ''}`}
            onClick={() => setMode(m.mode)}
            title={t(m.labelKey)}
          >
            <span className="mode-toolbar__icon">{m.icon}</span>
            <span className="mode-toolbar__label">{t(m.labelKey)}</span>
          </button>
        ))}
      </div>

      {mode === 'drawRoute' && <DrawActions />}
    </div>
  );
}
