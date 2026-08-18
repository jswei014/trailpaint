import { useProjectStore } from '../../store/useProjectStore';
import SpotEditor from '../SpotEditor';
import RouteEditor from '../RouteEditor';

/**
 * 017 D4: desktop right-hand properties panel. Mounts the existing
 * SpotEditor/RouteEditor unchanged; hidden entirely when nothing is selected
 * (the grid column collapses to zero width).
 */
export default function PropertiesPanel() {
  const spots = useProjectStore((s) => s.project.spots);
  const routes = useProjectStore((s) => s.project.routes);
  const selectedSpotId = useProjectStore((s) => s.selectedSpotId);
  const selectedRouteId = useProjectStore((s) => s.selectedRouteId);
  const setSelectedSpot = useProjectStore((s) => s.setSelectedSpot);
  const setSelectedRoute = useProjectStore((s) => s.setSelectedRoute);
  const updateSpot = useProjectStore((s) => s.updateSpot);
  const removeSpot = useProjectStore((s) => s.removeSpot);

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  if (!selectedSpot && !selectedRoute) return null;

  return (
    <div className="props-panel">
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
      ) : null}
    </div>
  );
}
