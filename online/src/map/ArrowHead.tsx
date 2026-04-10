import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { ROUTE_COLORS } from '../core/models/routes';

interface ArrowHeadProps {
  from: [number, number];
  to: [number, number];
  color: string;
}

// Sanitize color: only allow known ROUTE_COLORS stroke values
function safeColor(color: string): string {
  const valid = ROUTE_COLORS.find((c) => c.stroke === color);
  return valid ? valid.stroke : ROUTE_COLORS[0].stroke;
}

export default function ArrowHead({ from, to, color }: ArrowHeadProps) {
  const angle = Math.atan2(to[0] - from[0], to[1] - from[1]) * (180 / Math.PI);
  const safe = safeColor(color);

  const icon = L.divIcon({
    className: 'route-arrow',
    html: `<div style="
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-bottom: 14px solid ${safe};
      transform: rotate(${-angle}deg);
      transform-origin: center center;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  return <Marker position={to} icon={icon} interactive={false} />;
}
