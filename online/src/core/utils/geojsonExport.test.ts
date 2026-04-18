import { describe, it, expect } from 'vitest';
import { projectToGeojson } from './geojsonExport';
import { geojsonToImport } from './geojsonImport';
import type { Project } from '../models/types';

describe('projectToGeojson', () => {
  it('returns valid FeatureCollection for empty project', () => {
    const project: Project = {
      version: 4,
      name: 'Empty',
      center: [23.5, 121],
      zoom: 8,
      spots: [],
      routes: [],
    };
    const geojson = projectToGeojson(project);
    const parsed = JSON.parse(geojson);
    expect(parsed.type).toBe('FeatureCollection');
    expect(parsed.features).toHaveLength(0);
  });

  it('converts single spot to Point feature with correct coordinate order', () => {
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
          desc: 'Landmark building',
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [],
    };
    const geojson = projectToGeojson(project);
    const parsed = JSON.parse(geojson);
    expect(parsed.features).toHaveLength(1);
    const feature = parsed.features[0];
    expect(feature.type).toBe('Feature');
    expect(feature.geometry.type).toBe('Point');
    expect(feature.geometry.coordinates).toEqual([121.5654, 25.0330]); // [lng, lat]
    expect(feature.properties).toEqual({
      id: 'spot-1',
      num: 1,
      title: 'Taipei 101',
      desc: 'Landmark building',
      iconId: 'pin',
    });
  });

  it('omits falsy title and desc fields', () => {
    const project: Project = {
      version: 4,
      name: 'Test',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 'spot-1',
          latlng: [23.5, 121],
          num: 1,
          title: '', // empty title
          desc: '', // empty desc
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [],
    };
    const geojson = projectToGeojson(project);
    const parsed = JSON.parse(geojson);
    const feature = parsed.features[0];
    expect(feature.properties).not.toHaveProperty('title');
    expect(feature.properties).not.toHaveProperty('desc');
  });

  it('never includes photo field in spot properties', () => {
    const project: Project = {
      version: 4,
      name: 'Test',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 'spot-1',
          latlng: [23.5, 121],
          num: 1,
          title: 'With photo',
          desc: 'Description',
          photo: 'data:image/png;base64,xyz', // Should NOT be exported
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [],
    };
    const geojson = projectToGeojson(project);
    const parsed = JSON.parse(geojson);
    const feature = parsed.features[0];
    expect(feature.properties).not.toHaveProperty('photo');
  });

  it('converts single route to LineString feature with correct coordinate order', () => {
    const project: Project = {
      version: 4,
      name: 'Test',
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
    const geojson = projectToGeojson(project);
    const parsed = JSON.parse(geojson);
    expect(parsed.features).toHaveLength(1);
    const feature = parsed.features[0];
    expect(feature.type).toBe('Feature');
    expect(feature.geometry.type).toBe('LineString');
    expect(feature.geometry.coordinates).toEqual([
      [121.0, 25.0],
      [121.1, 25.1],
      [121.2, 25.2],
    ]); // [lng, lat] for each
    expect(feature.properties).toEqual({
      id: 'route-1',
      name: 'Mountain Trail',
      color: 'red',
    });
  });

  it('never includes elevations in route properties', () => {
    const project: Project = {
      version: 4,
      name: 'Test',
      center: [23.5, 121],
      zoom: 8,
      spots: [],
      routes: [
        {
          id: 'route-1',
          name: 'Trail',
          pts: [[25, 121]],
          color: 'blue',
          elevations: [100],
        },
      ],
    };
    const geojson = projectToGeojson(project);
    const parsed = JSON.parse(geojson);
    expect(parsed.features[0].properties).not.toHaveProperty('elevations');
  });

  it('omits route name if empty', () => {
    const project: Project = {
      version: 4,
      name: 'Test',
      center: [23.5, 121],
      zoom: 8,
      spots: [],
      routes: [
        {
          id: 'route-1',
          name: '', // empty name
          pts: [[25, 121]],
          color: 'green',
          elevations: [],
        },
      ],
    };
    const geojson = projectToGeojson(project);
    const parsed = JSON.parse(geojson);
    expect(parsed.features[0].properties).not.toHaveProperty('name');
  });

  it('round-trip: export and import preserves spot data', () => {
    const originalProject: Project = {
      version: 4,
      name: 'Round trip test',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 'spot-1',
          latlng: [25.033, 121.565],
          num: 1,
          title: 'Peak',
          desc: 'Mountain peak',
          photo: 'data:image/png;base64,ignored', // should not round-trip
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
        {
          id: 'spot-2',
          latlng: [24.5, 121.0],
          num: 2,
          title: 'Lake',
          desc: '',
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 10, y: -60 },
        },
      ],
      routes: [],
    };
    const geojson = projectToGeojson(originalProject);
    const parsed = JSON.parse(geojson);
    const imported = geojsonToImport(
      { featureCollection: parsed },
      { startingSpotNum: 0, startingRouteColorIdx: 0, mapCenter: [23.5, 121] }
    );

    expect(imported.spots).toHaveLength(2);
    expect(imported.spots[0].latlng).toEqual([25.033, 121.565]);
    expect(imported.spots[0].title).toBe('Peak');
    expect(imported.spots[0].desc).toBe('Mountain peak');
    expect(imported.spots[1].latlng).toEqual([24.5, 121.0]);
    expect(imported.spots[1].title).toBe('Lake');
    // desc was empty, so not in properties; imported as empty/default
  });

  it('round-trip: export and import preserves route data', () => {
    const originalProject: Project = {
      version: 4,
      name: 'Route test',
      center: [23.5, 121],
      zoom: 8,
      spots: [],
      routes: [
        {
          id: 'route-1',
          name: 'Main trail',
          pts: [
            [25.0, 121.0],
            [25.1, 121.1],
          ],
          color: 'red',
          elevations: [100, 200], // should not round-trip
        },
      ],
    };
    const geojson = projectToGeojson(originalProject);
    const parsed = JSON.parse(geojson);
    const imported = geojsonToImport(
      { featureCollection: parsed },
      { startingSpotNum: 0, startingRouteColorIdx: 0, mapCenter: [23.5, 121] }
    );

    expect(imported.routes).toHaveLength(1);
    const route = imported.routes[0];
    expect(route.name).toBe('Main trail');
    expect(route.pts).toEqual([
      [25.0, 121.0],
      [25.1, 121.1],
    ]);
    // Note: color is re-assigned by geojsonToImport from ROUTE_COLORS array,
    // so we just verify it's a valid color ID from ROUTE_COLORS
    expect(typeof route.color).toBe('string');
    // elevations not in GeoJSON export, so imported route.elevations is null
    expect(route.elevations).toBeNull();
  });

  it('produces valid JSON that can be parsed', () => {
    const project: Project = {
      version: 4,
      name: 'Complex test',
      center: [23.5, 121],
      zoom: 8,
      spots: [
        {
          id: 's1',
          latlng: [25, 121],
          num: 1,
          title: 'A',
          desc: 'Desc A',
          photo: null,
          iconId: 'pin',
          cardOffset: { x: 0, y: -60 },
        },
      ],
      routes: [
        {
          id: 'r1',
          name: 'Route A',
          pts: [[25, 121]],
          color: 'red',
          elevations: [],
        },
      ],
    };
    const geojson = projectToGeojson(project);
    expect(() => JSON.parse(geojson)).not.toThrow();
    const parsed = JSON.parse(geojson);
    expect(parsed.type).toBe('FeatureCollection');
    expect(parsed.features).toHaveLength(2);
  });
});
