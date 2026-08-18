import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { openStoryMode } from '../utils/storyMode';
import ListColumn from './ListColumn';
import SpotEditor from './SpotEditor';
import RouteEditor from './RouteEditor';
import ModeToolbar from './ModeToolbar';
import SearchBox from './SearchBox';
import SettingsPanel from './SettingsPanel';
import { t } from '../../i18n';

interface SidebarProps {
  onFlyTo: (latlng: [number, number], zoom?: number) => void;
  onOpenExportWizard: () => void;
  onOpenImportWizard: () => void;
}

export default function Sidebar({
  onFlyTo,
  onOpenExportWizard,
  onOpenImportWizard,
}: SidebarProps) {
  const spots = useProjectStore((s) => s.project.spots);
  const routes = useProjectStore((s) => s.project.routes);
  const selectedSpotId = useProjectStore((s) => s.selectedSpotId);
  const selectedRouteId = useProjectStore((s) => s.selectedRouteId);
  const sidebarOpen = useProjectStore((s) => s.sidebarOpen);
  const setSidebarOpen = useProjectStore((s) => s.setSidebarOpen);
  const setSelectedSpot = useProjectStore((s) => s.setSelectedSpot);
  const setSelectedRoute = useProjectStore((s) => s.setSelectedRoute);
  const updateSpot = useProjectStore((s) => s.updateSpot);
  const removeSpot = useProjectStore((s) => s.removeSpot);
  const baseMode = useProjectStore((s) => s.baseMode);
  const clearBackgroundImage = useProjectStore((s) => s.clearBackgroundImage);

  const projectName = useProjectStore((s) => s.project.name);
  const mapCenter = useProjectStore((s) => s.project.center);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const [showSettings, setShowSettings] = useState(false);

  const isImageMode = baseMode === 'image';
  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  const handleSearchSelect = (latlng: [number, number]) => {
    onFlyTo(latlng, 14);
  };

  const handleUndo = () => useProjectStore.temporal.getState().undo();
  const handleRedo = () => useProjectStore.temporal.getState().redo();

  return (
    <>
      <button
        className={`sidebar-toggle${sidebarOpen ? ' sidebar-toggle--open' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`sidebar${sidebarOpen ? '' : ' sidebar--closed'}`}>
        <div className="sidebar__header">
          <span className="sidebar__logo">🌿</span>
          <input
            className="sidebar__project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Untitled"
          />
        </div>

        {/* Toolbar row 1 */}
        <div className="sidebar__toolbar">
          <button className="sidebar__tool-btn" onClick={onOpenImportWizard}>{t('app.import')}</button>
          <button className="sidebar__tool-btn" onClick={onOpenExportWizard}>{t('app.export')}</button>
          {spots.length > 0 && (
            <button className="sidebar__tool-btn sidebar__tool-btn--story" onClick={() => {
              openStoryMode(useProjectStore.getState().project);
            }}>{t('app.storyMode')}</button>
          )}
        </div>

        {/* Toolbar row 2 */}
        <div className="sidebar__toolbar sidebar__toolbar--secondary">
          <button className="sidebar__tool-btn" onClick={handleUndo} title={t('undo')}>↩</button>
          <button className="sidebar__tool-btn" onClick={handleRedo} title={t('redo')}>↪</button>
          {isImageMode && (
            <button className="sidebar__tool-btn" onClick={() => {
              const hasData = spots.length > 0 || routes.length > 0;
              if (!hasData || confirm(t('bg.clearConfirm'))) clearBackgroundImage();
            }} title={t('bg.backToMap')}>
              ↩ {t('bg.backToMap')}
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button
            className={`sidebar__tool-btn${showSettings ? ' sidebar__tool-btn--active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >⚙️</button>
        </div>

        {showSettings && <SettingsPanel />}

        {/* Search — map mode only */}
        {!isImageMode && (
          <SearchBox
            mapCenter={mapCenter}
            onSelect={handleSearchSelect}
            onAddSpot={(latlng, title) => useProjectStore.getState().addSpot(latlng, title)}
          />
        )}

        <ModeToolbar />

        {/* Content */}
        {selectedSpot ? (
          <SpotEditor
            spot={selectedSpot}
            onUpdate={(patch) => updateSpot(selectedSpot.id, patch)}
            onDelete={() => removeSpot(selectedSpot.id)}
            onClose={() => setSelectedSpot(null)}
          />
        ) : selectedRoute ? (
          <RouteEditor
            route={selectedRoute}
            onClose={() => setSelectedRoute(null)}
          />
        ) : (
          <ListColumn onFlyTo={onFlyTo} showSearch={false} />
        )}
      </div>
    </>
  );
}
