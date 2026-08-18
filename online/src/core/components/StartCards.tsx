import { useProjectStore } from '../store/useProjectStore';
import { EXAMPLE_ROUTES, loadExampleRoute } from '../utils/sampleProject';
import { t } from '../../i18n';
import './StartCards.css';

interface StartCardsProps {
  onImportPhotos: () => void;
  onPasteJson: () => void;
  onManualStart: () => void;
}

/**
 * 017 D1: empty-project action cards. The three real entry points into a
 * project, surfaced on the map instead of buried behind menus. Rendered only
 * when shouldShowStartCards() says so (App.tsx owns the condition).
 */
export default function StartCards({ onImportPhotos, onPasteJson, onManualStart }: StartCardsProps) {
  const importJSON = useProjectStore((s) => s.importJSON);

  return (
    <div className="start-cards">
      <div className="start-cards__panel">
        <div className="start-cards__heading">
          <h1>{t('start.title')}</h1>
          <p>{t('start.subtitle')}</p>
        </div>

        <button className="start-cards__card start-cards__card--primary" onClick={onImportPhotos}>
          <span className="start-cards__icon">📷</span>
          <span className="start-cards__text">
            <b>{t('start.importPhotos')}</b>
            <span>{t('start.importPhotosDesc')}</span>
          </span>
        </button>

        <button className="start-cards__card" onClick={onPasteJson}>
          <span className="start-cards__icon">🤖</span>
          <span className="start-cards__text">
            <b>{t('start.pasteJson')}</b>
            <span>{t('start.pasteJsonDesc')}</span>
          </span>
        </button>

        <button className="start-cards__card" onClick={onManualStart}>
          <span className="start-cards__icon">🗺️</span>
          <span className="start-cards__text">
            <b>{t('start.manual')}</b>
            <span>{t('start.manualDesc')}</span>
          </span>
        </button>

        <select
          className="start-cards__sample"
          value=""
          onChange={async (e) => {
            const name = e.target.value;
            if (!name) return;
            const json = await loadExampleRoute(name);
            if (json) importJSON(json);
            e.target.value = '';
          }}
        >
          <option value="">🌿 {t('spot.loadSample')}</option>
          {EXAMPLE_ROUTES.map((ex) => (
            <option key={ex.name} value={ex.name}>{ex.icon} {ex.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
