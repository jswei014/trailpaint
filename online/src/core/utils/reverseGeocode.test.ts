import { describe, it, expect } from 'vitest';
import { formatPlaceName } from './reverseGeocode';

describe('formatPlaceName — POI tier (010 Nominatim upgrade)', () => {
  it('prefers namedetails name:zh-TW when available', () => {
    const result = formatPlaceName({
      namedetails: {
        'name:zh-TW': '朱拉隆功大學',
        'name:en': 'Chulalongkorn University',
        name: 'Chulalongkorn University',
      },
      address: { city: '曼谷' },
    });
    expect(result).toBe('朱拉隆功大學, 曼谷');
  });

  it('falls back to name:zh when name:zh-TW missing', () => {
    const result = formatPlaceName({
      namedetails: { 'name:zh': '曼谷皇宮', 'name:en': 'Grand Palace' },
      address: { city: '曼谷' },
    });
    expect(result).toBe('曼谷皇宮, 曼谷');
  });

  it('uses original namedetails.name when no zh translation', () => {
    const result = formatPlaceName({
      namedetails: { name: 'Chatuchak Market' },
      address: { city: '曼谷' },
    });
    expect(result).toBe('Chatuchak Market, 曼谷');
  });

  it('uses address.tourism as POI tag when namedetails absent', () => {
    const result = formatPlaceName({
      address: { tourism: '大皇宮', city: '曼谷' },
    });
    expect(result).toBe('大皇宮, 曼谷');
  });

  it('uses address.shop for retail POI', () => {
    const result = formatPlaceName({
      address: { shop: 'Siam Paragon', city: '曼谷' },
    });
    expect(result).toBe('Siam Paragon, 曼谷');
  });

  it('omits duplicate city when POI equals city (e.g. the pin landed on the city centre)', () => {
    const result = formatPlaceName({
      namedetails: { name: '曼谷' },
      address: { city: '曼谷' },
    });
    expect(result).toBe('曼谷');
  });
});

describe('formatPlaceName — district tier fallback', () => {
  it('uses neighbourhood + city when no POI', () => {
    const result = formatPlaceName({
      address: { neighbourhood: 'Sukhumvit', city: '曼谷' },
    });
    expect(result).toBe('Sukhumvit, 曼谷');
  });

  it('uses suburb when no neighbourhood', () => {
    const result = formatPlaceName({
      address: { suburb: '大安區', city: '台北市' },
    });
    expect(result).toBe('大安區, 台北市');
  });
});

describe('formatPlaceName — city-only and final fallback', () => {
  it('returns city alone when nothing else available', () => {
    const result = formatPlaceName({ address: { city: '曼谷' } });
    expect(result).toBe('曼谷');
  });

  it('falls back to county/state when no city', () => {
    const result = formatPlaceName({ address: { county: 'Phuket' } });
    expect(result).toBe('Phuket');
  });

  it('uses display_name first segment when address is empty', () => {
    const result = formatPlaceName({
      display_name: '曼谷, 泰國',
    });
    expect(result).toBe('曼谷');
  });

  it('returns empty string when nothing is parseable', () => {
    const result = formatPlaceName({});
    expect(result).toBe('');
  });
});
