import { describe, it, expect } from 'vitest';
import { projectToKml } from './kmlExport';
import type { Project } from '../models/types';

/**
 * Helper to parse KML string and validate it's well-formed XML.
 * In node/vitest, we use a simple regex check for structure,
 * since DOMParser may not be available without @xmldom/xmldom.
 */
function validateKmlStructure(kml: string): boolean {
  return (
    kml.includes('<?xml version="1.0" encoding="UTF-8"?>') &&
    kml.includes('<kml xmlns="http://www.opengis.net/kml/2.2">') &&
    kml.includes('<Document>') &&
    kml.includes('</Document>') &&
    kml.includes('</kml>')
  );
}

describe('projectToKml', () => {
  it('returns valid KML for empty project', () => {
    const project: Project = {
      version: 4,
      name: 'Empty',
      center: [23.5, 121],
      zoom: 8,
      spots: [],
      routes: [],
    };
    const kml = projectToKml(project);
    expect(validateKmlStructure(kml)).toBe(true);
    expect(kml).toContain('<name>Empty</name>');
    expect(kml.match(/<Placemark>/g) || []).toHaveLength(0);
  });

  it('converts single spot to Placemark with Point', () => {
    const project: Project = {
      version: 4,
      name: 'Test',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 'spot-1',
          latlng: [25.0330, 121.5654], // [lat, lng]
          num: 1,
          title: 'Taipei 101',
          desc: 'A landmark building',
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [],
    };
    const kml = projectToKml(project);
    expect(validateKmlStructure(kml)).toBe(true);
    expect(kml).toContain('<Placemark>');
    expect(kml).toContain('<name>Taipei 101</name>');
    expect(kml).toContain('<description>A landmark building</description>');
    expect(kml).toContain('<Point>');
    expect(kml).toContain('<coordinates>121.5654,25.033</coordinates>'); // [lng,lat]
  });

  it('omits description if spot desc is empty', () => {
    const project: Project = {
      version: 4,
      name: 'Test',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 'spot-1',
          latlng: [25, 121],
          num: 1,
          title: 'Place',
          desc: '', // empty
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [],
    };
    const kml = projectToKml(project);
    // description element should not be present or should be empty
    expect(kml).not.toContain('<description></description>');
  });

  it('escapes XML special characters in title and description', () => {
    const project: Project = {
      version: 4,
      name: 'Test & <Escape>',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 'spot-1',
          latlng: [25, 121],
          num: 1,
          title: 'Title with <tag> & "quotes"',
          desc: "It's a test with <xml> & other's stuff",
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [],
    };
    const kml = projectToKml(project);
    expect(kml).toContain('<name>Test &amp; &lt;Escape&gt;</name>'); // document name
    expect(kml).toContain('Title with &lt;tag&gt; &amp; &quot;quotes&quot;');
    expect(kml).toContain('It&#39;s a test with &lt;xml&gt; &amp; other&#39;s stuff');
  });

  it('converts single route to Placemark with LineString', () => {
    const project: Project = {
      version: 4,
      name: 'Route test',
      center: [23.5, 121],
      zoom: 8,
      spots: [],
      routes: [
        {
          id: 'route-1',
          name: 'Mountain Trail',
          pts: [
            [25.0, 121.0],
            [25.1, 121.1],
            [25.2, 121.2],
          ], // [lat, lng]
          color: 'red',
          elevations: [100, 200, 300],
        },
      ],
    };
    const kml = projectToKml(project);
    expect(validateKmlStructure(kml)).toBe(true);
    expect(kml).toContain('<Placemark>');
    expect(kml).toContain('<name>Mountain Trail</name>');
    expect(kml).toContain('<LineString>');
    expect(kml).toContain('<coordinates>121,25 121.1,25.1 121.2,25.2</coordinates>');
  });

  it('handles multiple spots and routes', () => {
    const project: Project = {
      version: 4,
      name: 'Multi test',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 's1',
          latlng: [25, 121],
          num: 1,
          title: 'Spot A',
          desc: 'First',
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
        {
          id: 's2',
          latlng: [24.5, 121.5],
          num: 2,
          title: 'Spot B',
          desc: 'Second',
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [
        {
          id: 'r1',
          name: 'Route 1',
          pts: [
            [25, 121],
            [24.5, 121.5],
          ],
          color: 'blue',
          elevations: [],
        },
      ],
    };
    const kml = projectToKml(project);
    const placemarkCount = (kml.match(/<Placemark>/g) || []).length;
    expect(placemarkCount).toBe(3); // 2 spots + 1 route
    expect(kml).toContain('Spot A');
    expect(kml).toContain('Spot B');
    expect(kml).toContain('Route 1');
  });

  it('never includes photo attribute in KML', () => {
    const project: Project = {
      version: 4,
      name: 'Image test',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 'spot-1',
          latlng: [25, 121],
          num: 1,
          title: 'With image',
          desc: 'Image data should not appear',
          photo: 'data:image/png;base64,xyz123', // Should NOT be in KML
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [],
    };
    const kml = projectToKml(project);
    expect(kml).not.toContain('data:image');
    expect(kml).not.toContain('base64');
  });

  it('never includes elevations attribute in KML', () => {
    const project: Project = {
      version: 4,
      name: 'Elevation test',
      center: [23.5, 121],
      zoom: 8,
      spots: [],
      routes: [
        {
          id: 'route-1',
          name: 'Trail',
          pts: [[25, 121]],
          color: 'green',
          elevations: [100, 200, 300], // Should NOT be in KML
        },
      ],
    };
    const kml = projectToKml(project);
    expect(kml).not.toContain('elevation');
    expect(kml).not.toContain('100');
  });

  it('produces well-formed KML with proper indentation', () => {
    const project: Project = {
      version: 4,
      name: 'Indent test',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 's1',
          latlng: [25, 121],
          num: 1,
          title: 'Test',
          desc: 'Test desc',
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [],
    };
    const kml = projectToKml(project);
    // Check for proper nesting by verifying opening/closing tags match
    const openDoc = (kml.match(/<Document>/g) || []).length;
    const closeDoc = (kml.match(/<\/Document>/g) || []).length;
    expect(openDoc).toBe(1);
    expect(closeDoc).toBe(1);

    const openKml = (kml.match(/<kml/g) || []).length;
    const closeKml = (kml.match(/<\/kml>/g) || []).length;
    expect(openKml).toBe(1);
    expect(closeKml).toBe(1);
  });

  it('handles empty route name', () => {
    const project: Project = {
      version: 4,
      name: 'Test',
      center: [23.5, 121],
      zoom: 8,
      spots: [],
      routes: [
        {
          id: 'r1',
          name: '', // empty name
          pts: [[25, 121]],
          color: 'red',
          elevations: [],
        },
      ],
    };
    const kml = projectToKml(project);
    // Empty name should still produce a Placemark with empty name tag
    expect(kml).toContain('<name></name>');
  });

  it('escapes all five XML entities correctly', () => {
    const project: Project = {
      version: 4,
      name: "Test's \"quotes\" & <angle>",
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 's1',
          latlng: [25, 121],
          num: 1,
          title: '&<>"\'',
          desc: 'All chars: & < > " \'',
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [],
    };
    const kml = projectToKml(project);
    expect(kml).toContain('&amp;');
    expect(kml).toContain('&lt;');
    expect(kml).toContain('&gt;');
    expect(kml).toContain('&quot;');
    expect(kml).toContain('&#39;');
    // Verify original unescaped chars do not appear in wrong places
    expect(kml).not.toContain('&<>"');
  });
});
