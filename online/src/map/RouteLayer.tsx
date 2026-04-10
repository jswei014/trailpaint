import { useCallback } from 'react';
import { Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useProjectStore } from '../core/store/useProjectStore';
import { getRouteColor } from '../core/models/routes';
import type { Route } from '../core/models/routes';
import ArrowHead from './ArrowHead';

export default function RouteLayer() {
  const routes = useProjectStore((s) => s.project.routes);
  const selectedRouteId = useProjectStore((s) => s.selectedRouteId);

  return (
    <>
      {routes.map((route) => (
        <RoutePolyline
          key={route.id}
          route={route}
          selected={route.id === selectedRouteId}
        />
      ))}
    </>
  );
}

function RoutePolyline({ route, selected }: { route: Route; selected: boolean }) {
  const setSelectedRoute = useProjectStore((s) => s.setSelectedRoute);
  const updateRoutePt = useProjectStore((s) => s.updateRoutePt);
  const deleteRoutePt = useProjectStore((s) => s.deleteRoutePt);
  const handDrawn = useProjectStore((s) => s.handDrawn);
  const colorDef = getRouteColor(route.color);
  const filterClass = handDrawn ? 'route-hand-drawn' : '';

  const handleClick = useCallback((e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    setSelectedRoute(route.id);
  }, [route.id, setSelectedRoute]);

  return (
    <>
      {/* Glow layer */}
      <Polyline
        positions={route.pts}
        pathOptions={{
          color: selected ? colorDef.hi : colorDef.glow,
          weight: selected ? 12 : 8,
          opacity: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
        }}
        interactive={false}
      />
      {/* Main line */}
      <Polyline
        positions={route.pts}
        pathOptions={{
          color: colorDef.stroke,
          weight: selected ? 6 : 4,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '18 9',
          className: filterClass,
        }}
        eventHandlers={{ click: handleClick }}
      />
      {/* Arrow at end */}
      {route.pts.length >= 2 && (
        <ArrowHead
          from={route.pts[route.pts.length - 2]}
          to={route.pts[route.pts.length - 1]}
          color={colorDef.stroke}
        />
      )}
      {/* Node markers when selected */}
      {selected &&
        route.pts.map((pt, i) => (
          <DraggableNode
            key={i}
            position={pt}
            color={colorDef.stroke}
            onDrag={(latlng) => updateRoutePt(route.id, i, latlng)}
            onDblClick={() => deleteRoutePt(route.id, i)}
          />
        ))}
    </>
  );
}

function DraggableNode({
  position,
  color,
  onDrag,
  onDblClick,
}: {
  position: [number, number];
  color: string;
  onDrag: (latlng: [number, number]) => void;
  onDblClick: () => void;
}) {
  return (
    <CircleMarker
      center={position}
      radius={7}
      pathOptions={{
        color,
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 3,
      }}
      eventHandlers={{
        mousedown: (e) => {
          L.DomEvent.stopPropagation(e);
          const map = e.target._map;
          map.dragging.disable();

          const onMove = (ev: MouseEvent) => {
            const pt = map.containerPointToLatLng(L.point(ev.clientX - map.getContainer().getBoundingClientRect().left, ev.clientY - map.getContainer().getBoundingClientRect().top));
            onDrag([pt.lat, pt.lng]);
          };
          const onUp = () => {
            map.dragging.enable();
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        },
        dblclick: (e) => {
          L.DomEvent.stopPropagation(e);
          onDblClick();
        },
        click: (e) => {
          L.DomEvent.stopPropagation(e);
        },
      }}
    />
  );
}
