import { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { openStoryMode } from '../../utils/storyMode';
import SettingsPanel from '../SettingsPanel';
import { t } from '../../../i18n';

interface TopBarProps {
  onOpenImportWizard: () => void;
  onOpenExportWizard: () => void;
}

/** 017 D4: desktop top action bar — identity left, actions right. */
export default function TopBar({ onOpenImportWizard, onOpenExportWizard }: TopBarProps) {
  const projectName = useProjectStore((s) => s.project.name);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const spotCount = useProjectStore((s) => s.project.spots.length);
  const baseMode = useProjectStore((s) => s.baseMode);
  const clearBackgroundImage = useProjectStore((s) => s.clearBackgroundImage);
  const [showSettings, setShowSettings] = useState(false);

  const handleUndo = () => useProjectStore.temporal.getState().undo();
  const handleRedo = () => useProjectStore.temporal.getState().redo();

  return (
    <div className="topbar">
      <span className="topbar__logo">🌿</span>
      <input
        className="topbar__project-name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="Untitled"
      />
      <button className="topbar__btn" onClick={handleUndo} title={t('undo')}>↩</button>
      <button className="topbar__btn" onClick={handleRedo} title={t('redo')}>↪</button>
      {baseMode === 'image' && (
        <button
          className="topbar__btn"
          onClick={() => {
            const s = useProjectStore.getState();
            const hasData = s.project.spots.length > 0 || s.project.routes.length > 0;
            if (!hasData || confirm(t('bg.clearConfirm'))) clearBackgroundImage();
          }}
        >
          ↩ {t('bg.backToMap')}
        </button>
      )}

      <span className="topbar__spacer" />

      <button className="topbar__btn" onClick={onOpenImportWizard}>{t('app.import')}</button>
      <button className="topbar__btn" onClick={onOpenExportWizard}>{t('app.export')}</button>
      {spotCount > 0 && (
        <button
          className="topbar__btn topbar__btn--primary"
          onClick={() => openStoryMode(useProjectStore.getState().project)}
        >
          {t('app.storyMode')}
        </button>
      )}
      <button
        className={`topbar__btn${showSettings ? ' topbar__btn--active' : ''}`}
        onClick={() => setShowSettings(!showSettings)}
      >⚙️</button>

      {showSettings && (
        <div className="topbar__settings-dropdown">
          <SettingsPanel />
        </div>
      )}
    </div>
  );
}
