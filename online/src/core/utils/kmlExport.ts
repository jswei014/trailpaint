import type { Project } from '../models/types';

/**
 * Escape XML special characters.
 * Converts &<>"' to their entity equivalents.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert a Project to KML string.
 * Spots → Placemark + Point; Routes → Placemark + LineString.
 * Does NOT include photo (D7 boundary: open data export only).
 *
 * @param project The project to export
 * @returns Stringified KML document
 */
export function projectToKml(project: Project): string {
  const projectName = escapeXml(project.name);
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '<Document>',
    `  <name>${projectName}</name>`,
  ];

  // Add spot placemarks
  project.spots.forEach((spot) => {
    const [lat, lng] = spot.latlng;
    const escapedTitle = escapeXml(spot.title);
    const escapedDesc = escapeXml(spot.desc);

    lines.push('  <Placemark>');
    lines.push(`    <name>${escapedTitle}</name>`);
    if (escapedDesc) {
      lines.push(`    <description>${escapedDesc}</description>`);
    }
    lines.push('    <Point>');
    lines.push(`      <coordinates>${lng},${lat}</coordinates>`);
    lines.push('    </Point>');
    lines.push('  </Placemark>');
  });

  // Add route placemarks
  project.routes.forEach((route) => {
    const escapedName = escapeXml(route.name);
    const coordinatesStr = route.pts
      .map(([lat, lng]) => `${lng},${lat}`)
      .join(' ');

    lines.push('  <Placemark>');
    lines.push(`    <name>${escapedName}</name>`);
    lines.push('    <LineString>');
    lines.push(`      <coordinates>${coordinatesStr}</coordinates>`);
    lines.push('    </LineString>');
    lines.push('  </Placemark>');
  });

  lines.push('</Document>');
  lines.push('</kml>');

  return lines.join('\n');
}
