import type { Mode } from '../../models/types';
import { useProjectStore } from '../../store/useProjectStore';
import { t } from '../../../i18n';

const TOOLS: { mode: Mode; icon: string; labelKey: 'mode.select' | 'mode.addSpot' | 'mode.drawRoute' }[] = [
  { mode: 'select', icon: '🖱️', labelKey: 'mode.select' },
  { mode: 'addSpot', icon: '📍', labelKey: 'mode.addSpot' },
  { mode: 'drawRoute', icon: '🖊️', labelKey: 'mode.drawRoute' },
];

/** 017 D4: slim desktop tool dock. Same store.mode as the mobile toolbar. */
export default function ToolDock() {
  const mode = useProjectStore((s) => s.mode);
  const setMode = useProjectStore((s) => s.setMode);
  const listColumnOpen = useProjectStore((s) => s.listColumnOpen);
  const setListColumnOpen = useProjectStore((s) => s.setListColumnOpen);

  return (
    <div className="tool-dock">
      {TOOLS.map((tool) => (
        <button
          key={tool.mode}
          className={`tool-dock__tool${mode === tool.mode ? ' tool-dock__tool--active' : ''}`}
          onClick={() => setMode(tool.mode)}
          title={t(tool.labelKey)}
        >
          <span className="tool-dock__icon">{tool.icon}</span>
          <span className="tool-dock__label">{t(tool.labelKey)}</span>
        </button>
      ))}
      <span className="tool-dock__spacer" />
      <button
        className="tool-dock__tool"
        onClick={() => setListColumnOpen(!listColumnOpen)}
        title={listColumnOpen ? t('dock.collapseList') : t('dock.expandList')}
      >
        <span className="tool-dock__icon">{listColumnOpen ? '⇤' : '⇥'}</span>
        <span className="tool-dock__label">{t('dock.list')}</span>
      </button>
    </div>
  );
}
