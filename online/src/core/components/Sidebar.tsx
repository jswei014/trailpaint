import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import SpotList from './SpotList';
import SpotEditor from './SpotEditor';
import RouteEditor from './RouteEditor';
import ModeToolbar from './ModeToolbar';
import SearchBox from './SearchBox';
import SettingsPanel from './SettingsPanel';
import { polylineDistance, formatDistance } from '../utils/geo';
import { getRouteColor } from '../models/routes';
import { t } from '../../i18n';

interface SidebarProps {
  onFlyTo: (latlng: [number, number], zoom?: number) => void;
  onExport: (pixelRatio: number) => void;
  onSave: () => void;
  onLoad: () => void;
  onImportGpx: () => void;
}

export default function Sidebar({ onFlyTo, onExport, onSave, onLoad, onImportGpx }: SidebarProps) {
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
  const swapSpots = useProjectStore((s) => s.swapSpots);

  const projectName = useProjectStore((s) => s.project.name);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const [showSettings, setShowSettings] = useState(false);

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedSpot(id);
    const spot = spots.find((s) => s.id === id);
    if (spot) onFlyTo(spot.latlng);
  };

  const handleSearchSelect = (latlng: [number, number]) => {
    onFlyTo(latlng, 14);
  };

  const handleUndo = () => useProjectStore.temporal.getState().undo();
  const handleRedo = () => useProjectStore.temporal.getState().redo();

  return (
    <>
      <button
        className="sidebar-toggle"
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

        {/* Toolbar row 1: actions */}
        <div className="sidebar__toolbar">
          <button className="sidebar__tool-btn" onClick={() => onExport(2)}>{t('app.export')}</button>
          <button className="sidebar__tool-btn" onClick={onSave}>{t('app.save')}</button>
          <button className="sidebar__tool-btn" onClick={onLoad}>{t('app.load')}</button>
          <button className="sidebar__tool-btn" onClick={onImportGpx}>{t('gpx.import')}</button>
        </div>

        {/* Toolbar row 2: undo/redo + settings */}
        <div className="sidebar__toolbar sidebar__toolbar--secondary">
          <button className="sidebar__tool-btn" onClick={handleUndo} title={t('undo')}>↩</button>
          <button className="sidebar__tool-btn" onClick={handleRedo} title={t('redo')}>↪</button>
          <span style={{ flex: 1 }} />
          <button
            className={`sidebar__tool-btn${showSettings ? ' sidebar__tool-btn--active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >⚙️</button>
        </div>

        {/* Settings panel (collapsible) */}
        {showSettings && <SettingsPanel />}

        {/* Search */}
        <SearchBox onSelect={handleSearchSelect} />

        {/* Mode toolbar — always visible */}
        <ModeToolbar />

        {/* Content area */}
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
          <>
            <SpotList
              spots={spots}
              selectedSpotId={selectedSpotId}
              onSelect={handleSelect}
              onSwap={swapSpots}
            />
            {routes.length > 0 && (
              <div className="route-summary">
                <div className="route-summary__title">{t('route.listTitle')}</div>
                {routes.map((r) => {
                  const color = getRouteColor(r.color);
                  return (
                    <div
                      key={r.id}
                      className="route-summary__item"
                      onClick={() => setSelectedRoute(r.id)}
                    >
                      <span className="route-summary__color" style={{ background: color.stroke }} />
                      <span className="route-summary__dist">{formatDistance(polylineDistance(r.pts))}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
