import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseCoords,
  getAlternateQuery,
  splitDisplayName,
  formatPhotonFeature,
  formatNominatimItem,
  forwardGeocode,
  searchPhoton,
  searchNominatim,
} from './forwardGeocode';

describe('forwardGeocode utility tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('parseCoords', () => {
    it('parses comma-separated lat/lng', () => {
      expect(parseCoords('25.0330, 121.5654')).toEqual([25.033, 121.5654]);
      expect(parseCoords('-23.5, -46.6')).toEqual([-23.5, -46.6]);
    });

    it('parses space-separated lat/lng', () => {
      expect(parseCoords('25.0330 121.5654')).toEqual([25.033, 121.5654]);
    });

    it('returns null for invalid inputs or out of range coords', () => {
      expect(parseCoords('hello world')).toBeNull();
      expect(parseCoords('95.0, 120.0')).toBeNull(); // lat > 90
      expect(parseCoords('25.0, 200.0')).toBeNull(); // lon > 180
    });
  });

  describe('getAlternateQuery', () => {
    it('converts 台 to 臺', () => {
      expect(getAlternateQuery('台北101')).toBe('臺北101');
      expect(getAlternateQuery('台灣大學')).toBe('臺灣大學');
    });

    it('converts 臺 to 台', () => {
      expect(getAlternateQuery('臺北市')).toBe('台北市');
      expect(getAlternateQuery('臺中車站')).toBe('台中車站');
    });

    it('swaps when both exist', () => {
      expect(getAlternateQuery('台灣與臺北')).toBe('臺灣與台北');
    });

    it('returns null when neither character is present', () => {
      expect(getAlternateQuery('玉山主峰')).toBeNull();
      expect(getAlternateQuery('Tokyo Tower')).toBeNull();
    });
  });

  describe('splitDisplayName', () => {
    it('splits name and address correctly', () => {
      expect(splitDisplayName('七星山, 臺北市, 臺灣')).toEqual({
        name: '七星山',
        address: '臺北市, 臺灣',
      });
      expect(splitDisplayName('玉山')).toEqual({
        name: '玉山',
        address: '',
      });
    });
  });

  describe('formatPhotonFeature', () => {
    it('formats a valid Photon feature', () => {
      const feat = {
        geometry: { coordinates: [121.5534, 25.1707] as [number, number] },
        properties: {
          name: '七星山',
          city: '臺北市',
          country: '臺灣',
          osm_key: 'natural',
          osm_value: 'peak',
        },
      };
      const result = formatPhotonFeature(feat);
      expect(result).toEqual({
        display_name: '七星山, 臺北市, 臺灣',
        name: '七星山',
        address: '臺北市, 臺灣',
        lat: 25.1707,
        lon: 121.5534,
        type: 'peak',
        class: 'natural',
      });
    });

    it('returns null for missing coordinates', () => {
      expect(formatPhotonFeature({})).toBeNull();
      expect(formatPhotonFeature({ geometry: { coordinates: [] as unknown as [number, number] } })).toBeNull();
    });
  });

  describe('formatNominatimItem', () => {
    it('formats a valid Nominatim item', () => {
      const item = {
        name: '冷水坑',
        display_name: '冷水坑, 士林區, 臺北市, 臺灣',
        lat: '25.1660',
        lon: '121.5645',
        type: 'attraction',
        class: 'tourism',
      };
      const result = formatNominatimItem(item);
      expect(result).toEqual({
        display_name: '冷水坑, 士林區, 臺北市, 臺灣',
        name: '冷水坑',
        address: '士林區, 臺北市',
        lat: 25.166,
        lon: 121.5645,
        type: 'attraction',
        class: 'tourism',
      });
    });
  });

  describe('searchPhoton & proximity bias', () => {
    it('appends proximity parameters when provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [
            {
              geometry: { coordinates: [121.5644, 25.0338] },
              properties: { name: '台北101', city: '台北市' },
            },
          ],
        }),
      });
      global.fetch = mockFetch;

      const res = await searchPhoton('台北101', { proximity: [25.03, 121.56] });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('&lat=25.03&lon=121.56'),
        expect.any(Object)
      );
      expect(res.length).toBe(1);
      expect(res[0].name).toBe('台北101');
    });
  });

  describe('forwardGeocode integration and fallbacks', () => {
    it('returns coordinate item directly without network call', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const res = await forwardGeocode('25.0330, 121.5654');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res).toHaveLength(1);
      expect(res[0].type).toBe('coordinate');
      expect(res[0].lat).toBeCloseTo(25.033);
      expect(res[0].lon).toBeCloseTo(121.5654);
    });

    it('returns empty array for very short queries', async () => {
      expect(await forwardGeocode('a')).toEqual([]);
    });

    it('falls back to alternate query (台 ⇄ 臺) if initial Photon returns empty', async () => {
      const mockFetch = vi.fn()
        // First call (臺北101) returns empty
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ features: [] }),
        })
        // Second call (台北101) returns feature
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            features: [
              {
                geometry: { coordinates: [121.5644, 25.0338] },
                properties: { name: '台北101', city: '台北市' },
              },
            ],
          }),
        });
      global.fetch = mockFetch;

      const res = await forwardGeocode('臺北101');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('台北101');
    });

    it('falls back to Nominatim when Photon fails or returns empty', async () => {
      const mockFetch = vi.fn()
        // Photon fails
        .mockRejectedValueOnce(new Error('Network error'))
        // Nominatim returns result
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              name: '玉山',
              display_name: '玉山, 信義鄉, 南投縣, 臺灣',
              lat: '23.47',
              lon: '120.957',
              type: 'peak',
              class: 'natural',
            },
          ],
        });
      global.fetch = mockFetch;

      const res = await forwardGeocode('玉山');
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('玉山');
      expect(res[0].lat).toBe(23.47);
    });
  });
});
