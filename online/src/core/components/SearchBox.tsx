import { useState, useRef, useCallback, useEffect } from 'react';
import { t } from '../../i18n';
import { forwardGeocode, type SearchResultItem } from '../utils/forwardGeocode';

const TYPE_ICONS: Record<string, string> = {
  peak: '⛰️',
  mountain: '⛰️',
  volcano: '🌋',
  hill: '⛰️',
  national_park: '🌲',
  park: '🌳',
  nature_reserve: '🌿',
  water: '💧',
  river: '🏞️',
  lake: '💧',
  village: '🏘️',
  town: '🏘️',
  city: '🏙️',
  hamlet: '🏠',
  trail: '🥾',
  path: '🥾',
  bus_stop: '🚌',
  station: '🚉',
  parking: '🅿️',
  viewpoint: '🔭',
  camp_site: '⛺',
  shelter: '🛖',
  coordinate: '📌',
};

function getTypeIcon(type: string, cls: string): string {
  return TYPE_ICONS[type] || TYPE_ICONS[cls] || '📍';
}

interface SearchBoxProps {
  mapCenter?: [number, number];
  onSelect: (latlng: [number, number], name: string) => void;
  onAddSpot?: (latlng: [number, number], title: string) => void;
}

export default function SearchBox({ mapCenter, onSelect, onAddSpot }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup timer and abort on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }

      // Abort previous request to prevent race condition
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setSearched(true);

      try {
        const items = await forwardGeocode(q, {
          proximity: mapCenter,
          signal: controller.signal,
        });
        setResults(items);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [mapCenter]
  );

  const handleInput = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    timerRef.current = setTimeout(() => search(value), 400);
  };

  const handleSelect = (r: SearchResultItem) => {
    if (!isFinite(r.lat) || !isFinite(r.lon)) return;
    onSelect([r.lat, r.lon], r.display_name);
    // Coordinate input: also create a spot at that location
    if (r.type === 'coordinate' && onAddSpot) {
      onAddSpot([r.lat, r.lon], r.name);
    }
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const showDropdown = loading || (searched && query.trim().length >= 2);

  return (
    <div className="search-box">
      <div className="search-box__input-wrap">
        <span className="search-box__icon">🔍</span>
        <input
          className="search-box__input"
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={t('search.placeholder')}
        />
        {query && (
          <button
            className="search-box__clear"
            onClick={() => {
              setQuery('');
              setResults([]);
              setSearched(false);
            }}
          >
            ✕
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="search-box__dropdown">
          {loading && (
            <div className="search-box__loading">
              <span className="search-box__spinner" />
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="search-box__empty">{t('search.noResult')}</div>
          )}
          {!loading &&
            results.map((r, i) => {
              const icon = getTypeIcon(r.type, r.class);
              return (
                <div
                  key={i}
                  className="search-box__item"
                  onClick={() => handleSelect(r)}
                >
                  <span className="search-box__item-icon">{icon}</span>
                  <div className="search-box__item-text">
                    <div className="search-box__item-name">{r.name}</div>
                    {r.address && <div className="search-box__item-addr">{r.address}</div>}
                  </div>
                  {onAddSpot && (
                    <button
                      className="search-box__add-btn"
                      title={t('mode.addSpot')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isFinite(r.lat) || !isFinite(r.lon)) return;
                        onSelect([r.lat, r.lon], r.display_name); // Also fly to it
                        onAddSpot([r.lat, r.lon], r.name);
                        setQuery('');
                        setResults([]);
                        setSearched(false);
                      }}
                    >
                      ＋
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
